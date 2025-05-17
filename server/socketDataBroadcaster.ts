/**
 * server/socketDataBroadcaster.ts
 * Socket.IOを使用したデータ配信を管理するブロードキャスタークラス
 * - 改善点: チャンネル名とキャッシュキーの生成をユーティリティに移動
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { LRUCache } from './cacheManager';
import { logger } from '@/utils/common';
import { ExchangeType, ExchangeProductType } from '@/types/constants/enums';
import { safeExchangeType, safeProductType } from '@/utils/exchangeTypeUtils';
import { validateWebSocketMessage } from '../types/websocket';
import { 
  buildChannelKey, 
  createChannelKeyComponents, 
  getChannelName as utilGetChannelName, 
  getCacheKey as utilGetCacheKey
} from '../utils/channelKey';

// チャンネル名の定数
export enum ChannelName {
  ORDERBOOK = 'orderbook',
  KLINE = 'kline',
  TRADE = 'trade'
}

// クライアント購読情報の型定義
interface ClientSubscription {
  clientId: string;
  symbol: string;
  type: ChannelName;
  timeframe?: string;
  exchangeType: ExchangeType | ExchangeProductType;
}

// チャンネル統計情報の型定義
interface ChannelStats {
  name: string;
  clientCount: number;
  messageCount: number;
  lastBroadcastTime: number | null;
  dataSize: number;
}

// クライアント統計情報の型定義
interface ClientStats {
  clientId: string;
  subscriptions: number;
  connectedAt: number;
  lastActivity: number;
  ip?: string;
  userAgent?: string;
}

/**
 * Socket.IOデータブロードキャスタークラス
 * 
 * Socket.IOを使用してWebSocketデータをクライアントに配信します。
 * シンボルごとのデータ配信チャネルを管理し、クライアントの購読を追跡します。
 */
export class SocketDataBroadcaster {
  private io: SocketIOServer;
  private cache: {
    orderBook: LRUCache<any>;
    kline: LRUCache<any>;
    trade: LRUCache<any>;
  };
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  private channelClients: Map<string, Set<string>> = new Map();
  private messageStats: Map<string, { count: number, lastTime: number, size: number }> = new Map();
  private clientInfo: Map<string, { 
    connectedAt: number, 
    lastActivity: number, 
    ip?: string, 
    userAgent?: string 
  }> = new Map();
  private maxQueueSize: number;

  /**
   * SocketDataBroadcasterを初期化
   * 
   * @param io Socket.IOサーバーインスタンス
   * @param maxQueueSize 最大キューサイズ（バックプレッシャー制御用）
   */
  constructor(io: SocketIOServer, maxQueueSize: number = 100) {
    this.io = io;
    this.maxQueueSize = maxQueueSize;
    
    // キャッシュの初期化
    this.cache = {
      orderBook: new LRUCache<any>(100, 60 * 1000), // 100アイテム、1分のTTL
      kline: new LRUCache<any>(200, 10 * 60 * 1000), // 200アイテム、10分のTTL
      trade: new LRUCache<any>(50, 30 * 1000) // 50アイテム、30秒のTTL
    };
    
    // Socket.IOハンドラの設定
    this.setupSocketHandlers();
    
    logger.info('SocketDataBroadcaster initialized', {
      component: 'SocketDataBroadcaster',
      action: 'constructor'
    });
  }

  /**
   * Socket.IOハンドラの設定
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      const address = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];
      
      logger.info(`Client connected: ${clientId}`, {
        component: 'SocketDataBroadcaster',
        action: 'connection',
        clientId,
        address
      });
      
      // クライアント情報を保存
      this.clientInfo.set(clientId, {
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        ip: address,
        userAgent
      });
      
      // 購読リクエストのハンドラ
      socket.on('subscribe', (data: any) => {
        try {
          const { symbol, type, timeframe, exchangeType = 'spot' } = data;
          
          if (!symbol || !type) {
            socket.emit('error', { message: 'Invalid subscription data: symbol and type are required' });
            return;
          }
          
          // 購読情報の作成
          const subscription: ClientSubscription = {
            clientId,
            symbol,
            type: type as ChannelName,
            timeframe,
            exchangeType
          };
          
          // 購読の追加
          this.addSubscription(subscription);
          
          // 購読成功を通知
          socket.emit('subscribed', { symbol, type, timeframe, exchangeType });
          
          // キャッシュされたデータがあれば即時送信
          this.sendCachedData(socket, subscription);
          
          logger.info(`Client ${clientId} subscribed to ${type} for ${symbol}`, {
            component: 'SocketDataBroadcaster',
            action: 'subscribe',
            subscription
          });
        } catch (error) {
          logger.error('Error handling subscribe request', error, {
            component: 'SocketDataBroadcaster',
            action: 'subscribe',
            clientId,
            data
          });
          
          socket.emit('error', { message: 'Failed to subscribe', error: String(error) });
        }
      });
      
      // 購読解除リクエストのハンドラ
      socket.on('unsubscribe', (data: any) => {
        try {
          const { symbol, type, timeframe, exchangeType = 'spot' } = data;
          
          if (!symbol || !type) {
            socket.emit('error', { message: 'Invalid unsubscription data: symbol and type are required' });
            return;
          }
          
          // 購読情報の作成
          const subscription: ClientSubscription = {
            clientId,
            symbol,
            type: type as ChannelName,
            timeframe,
            exchangeType
          };
          
          // 購読の削除
          this.removeSubscription(subscription);
          
          // 購読解除成功を通知
          socket.emit('unsubscribed', { symbol, type, timeframe, exchangeType });
          
          logger.info(`Client ${clientId} unsubscribed from ${type} for ${symbol}`, {
            component: 'SocketDataBroadcaster',
            action: 'unsubscribe',
            subscription
          });
        } catch (error) {
          logger.error('Error handling unsubscribe request', error, {
            component: 'SocketDataBroadcaster',
            action: 'unsubscribe',
            clientId,
            data
          });
          
          socket.emit('error', { message: 'Failed to unsubscribe', error: String(error) });
        }
      });
      
      // 切断時のハンドラ
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${clientId}`, {
          component: 'SocketDataBroadcaster',
          action: 'disconnect',
          clientId
        });
        
        // クライアントの全購読を削除
        this.removeAllSubscriptions(clientId);
        
        // クライアント情報を削除
        this.clientInfo.delete(clientId);
      });
      
      // エラー時のハンドラ
      socket.on('error', (error) => {
        logger.error(`Socket error for client ${clientId}`, error, {
          component: 'SocketDataBroadcaster',
          action: 'error',
          clientId
        });
      });
      
      // 接続成功を通知
      socket.emit('connected', { clientId });
    });
  }

  /**
   * オーダーブックデータをブロードキャスト
   * 
   * @param symbol シンボル
   * @param data オーダーブックデータ
   * @param exchangeType 取引種別('spot', 'futures'等)または取引所タイプ('bitget'等)
   */
  public broadcastOrderBook(symbol: string, data: any, exchangeType?: ExchangeType | ExchangeProductType): void {
    try {
      this.processBroadcast({
        type: ChannelName.ORDERBOOK,
        action: 'broadcastOrderBook',
        symbol,
        data,
        exchangeType
      });
    } catch (error) {
      logger.error(`Error broadcasting orderbook for ${symbol}`, error, {
        component: 'SocketDataBroadcaster',
        action: 'broadcastOrderBook',
        symbol,
        exchangeType
      });
    }
  }

  /**
   * ローソク足データをブロードキャスト
   * 
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param data ローソク足データ
   * @param exchangeType 取引種別('spot', 'futures'等)または取引所タイプ('bitget'等)
   */
  public broadcastKline(symbol: string, timeframe: string, data: any, exchangeType?: ExchangeType | ExchangeProductType): void {
    try {
      this.processBroadcast({
        type: ChannelName.KLINE,
        action: 'broadcastKline',
        symbol,
        timeframe,
        data,
        exchangeType
      });
    } catch (error) {
      logger.error(`Error broadcasting kline for ${symbol} (${timeframe})`, error, {
        component: 'SocketDataBroadcaster',
        action: 'broadcastKline',
        symbol,
        timeframe,
        exchangeType
      });
    }
  }

  /**
   * 取引データをブロードキャスト
   * 
   * @param symbol シンボル
   * @param data 取引データ
   * @param exchangeType 取引種別('spot', 'futures'等)または取引所タイプ('bitget'等)
   */
  public broadcastTrade(symbol: string, data: any, exchangeType?: ExchangeType | ExchangeProductType): void {
    try {
      this.processBroadcast({
        type: ChannelName.TRADE,
        action: 'broadcastTrade',
        symbol,
        data,
        exchangeType
      });
    } catch (error) {
      logger.error(`Error broadcasting trade for ${symbol}`, error, {
        component: 'SocketDataBroadcaster',
        action: 'broadcastTrade',
        symbol,
        exchangeType
      });
    }
  }

  /**
   * 共通のバリデーション、キャッシュ、ブロードキャスト処理
   *
   * @param params ブロードキャストパラメータ
   */
  private processBroadcast(params: {
    type: ChannelName;
    action: string;
    symbol: string;
    data: any;
    timeframe?: string;
    exchangeType?: ExchangeType | ExchangeProductType;
  }): void {
    const { type, action, symbol, data, timeframe, exchangeType } = params;

    // 取引所タイプに変換
    const safeExchangeTypeValue = safeExchangeType(exchangeType || 'bitget');

    // バリデーションデータの構築
    const validationPayload: Record<string, any> = {
      type,
      symbol,
      exchangeType: safeExchangeTypeValue,
      data,
      timestamp: Date.now()
    };

    if (timeframe) {
      validationPayload.timeframe = timeframe;
    }

    // データの検証
    const validation = validateWebSocketMessage(validationPayload);

    if (!validation.success) {
      logger.warn(`Invalid ${type} data`, {
        component: 'SocketDataBroadcaster',
        action,
        error: validation.error
      });
    }

    // チャンネルコンポーネントの作成
    const channelComponents = createChannelKeyComponents(
      type,
      symbol,
      timeframe,
      safeExchangeTypeValue
    );

    // チャンネル名とキャッシュキー
    const channelName = utilGetChannelName(channelComponents);
    const cacheKey = utilGetCacheKey(channelComponents);

    // データをキャッシュ
    switch (type) {
      case ChannelName.ORDERBOOK:
        this.cache.orderBook.set(cacheKey, data);
        break;
      case ChannelName.KLINE:
        this.cache.kline.set(cacheKey, data);
        break;
      case ChannelName.TRADE:
        this.cache.trade.set(cacheKey, data);
        break;
    }

    // データをブロードキャスト
    this.broadcastToChannel(channelName, type, validationPayload);
  }

  /**
   * チャンネルにデータをブロードキャスト
   * 
   * @param channelName チャンネル名
   * @param eventName イベント名
   * @param data 送信データ
   */
  private broadcastToChannel(channelName: string, eventName: string, data: any): void {
    // チャンネルに接続されているクライアントがいるか確認
    if (!this.channelClients.has(channelName) || this.channelClients.get(channelName)?.size === 0) {
      return;
    }
    
    // データサイズの計算
    const dataSize = JSON.stringify(data).length;
    
    // 統計情報の更新
    if (!this.messageStats.has(channelName)) {
      this.messageStats.set(channelName, { count: 0, lastTime: 0, size: 0 });
    }
    
    const stats = this.messageStats.get(channelName)!;
    stats.count++;
    stats.lastTime = Date.now();
    stats.size = dataSize;
    
    // バックプレッシャーチェック
    // 送信キューが大きすぎる場合は警告を出力
    const room = this.io.to(channelName);
    if ((room as any).adapter && (room as any).adapter.rooms) {
      const roomSize = (room as any).adapter.rooms.get(channelName)?.size || 0;
      
      if (roomSize > this.maxQueueSize) {
        logger.warn(`Backpressure detected: ${channelName} has ${roomSize} clients`, {
          component: 'SocketDataBroadcaster',
          action: 'broadcastToChannel',
          channelName,
          roomSize,
          maxQueueSize: this.maxQueueSize
        });
      }
    }
    
    // データをブロードキャスト
    this.io.to(channelName).emit(eventName, data);
    
    logger.debug(`Broadcasted ${eventName} to ${channelName}`, {
      component: 'SocketDataBroadcaster',
      action: 'broadcastToChannel',
      channelName,
      eventName,
      dataSize
    });
  }

  /**
   * キャッシュされたデータを取得
   * 
   * @param type データタイプ
   * @param symbol シンボル
   * @param timeframe タイムフレーム（klineの場合のみ必要）
   * @param exchangeType 取引種別または取引所タイプ
   * @returns キャッシュされたデータ、存在しない場合はnull
   */
  public getCachedData(
    type: ChannelName,
    symbol: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): any | null {
    const safeExchangeTypeValue = safeExchangeType(exchangeType || 'bitget');
    const components = createChannelKeyComponents(type, symbol, timeframe, safeExchangeTypeValue);
    const cacheKey = utilGetCacheKey(components);
    
    switch (type) {
      case ChannelName.ORDERBOOK:
        return this.cache.orderBook.get(cacheKey);
      case ChannelName.KLINE:
        return this.cache.kline.get(cacheKey);
      case ChannelName.TRADE:
        return this.cache.trade.get(cacheKey);
      default:
        return null;
    }
  }

  /**
   * キャッシュキーの生成
   * 
   * @param type データタイプ
   * @param symbol シンボル
   * @param timeframe タイムフレーム（klineの場合のみ必要）
   * @param exchangeType 取引種別または取引所タイプ
   * @returns キャッシュキー
   */
  private getCacheKey(
    type: ChannelName,
    symbol: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): string {
    const safeExchangeTypeValue = safeExchangeType(exchangeType || 'bitget');
    const components = createChannelKeyComponents(type, symbol, timeframe, safeExchangeTypeValue);
    return utilGetCacheKey(components);
  }

  /**
   * チャンネル名の生成
   * 
   * @param type データタイプ
   * @param symbol シンボル
   * @param timeframe タイムフレーム（klineの場合のみ必要）
   * @param exchangeType 取引種別または取引所タイプ
   * @returns チャンネル名
   */
  private getChannelName(
    type: ChannelName,
    symbol: string,
    timeframe?: string,
    exchangeType?: ExchangeType | ExchangeProductType
  ): string {
    const safeExchangeTypeValue = safeExchangeType(exchangeType || 'bitget');
    const components = createChannelKeyComponents(type, symbol, timeframe, safeExchangeTypeValue);
    return utilGetChannelName(components);
  }

  /**
   * 購読情報の追加
   * 
   * @param subscription 購読情報
   */
  private addSubscription(subscription: ClientSubscription): void {
    const { clientId, symbol, type, timeframe, exchangeType } = subscription;
    
    // チャンネル名の生成
    const channelName = this.getChannelName(type, symbol, timeframe, exchangeType);
    
    // 購読情報の保存
    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set<string>());
    }
    
    this.clientSubscriptions.get(clientId)?.add(channelName);
    
    // チャンネルクライアント情報の保存
    if (!this.channelClients.has(channelName)) {
      this.channelClients.set(channelName, new Set<string>());
    }
    
    this.channelClients.get(channelName)?.add(clientId);
    
    // Socket.IOのルームに参加
    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.join(channelName);
      
      // クライアント情報の更新
      const clientInfo = this.clientInfo.get(clientId);
      if (clientInfo) {
        clientInfo.lastActivity = Date.now();
      }
    }
  }

  /**
   * 購読情報の削除
   * 
   * @param subscription 購読情報
   */
  private removeSubscription(subscription: ClientSubscription): void {
    const { clientId, symbol, type, timeframe, exchangeType } = subscription;
    
    // チャンネル名の生成
    const channelName = this.getChannelName(type, symbol, timeframe, exchangeType);
    
    // 購読情報の削除
    this.clientSubscriptions.get(clientId)?.delete(channelName);
    
    // セットが空になった場合はMapからも削除
    if (this.clientSubscriptions.get(clientId)?.size === 0) {
      this.clientSubscriptions.delete(clientId);
    }
    
    // チャンネルクライアント情報の削除
    this.channelClients.get(channelName)?.delete(clientId);
    
    // セットが空になった場合はMapからも削除
    if (this.channelClients.get(channelName)?.size === 0) {
      this.channelClients.delete(channelName);
    }
    
    // Socket.IOのルームから退出
    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      socket.leave(channelName);
      
      // クライアント情報の更新
      const clientInfo = this.clientInfo.get(clientId);
      if (clientInfo) {
        clientInfo.lastActivity = Date.now();
      }
    }
  }

  /**
   * クライアントの全購読を削除
   * 
   * @param clientId クライアントID
   */
  private removeAllSubscriptions(clientId: string): void {
    // クライアントの購読情報を取得
    const subscriptions = this.clientSubscriptions.get(clientId);
    if (!subscriptions) {
      return;
    }
    
    // 各チャンネルからクライアントを削除
    for (const channelName of subscriptions) {
      this.channelClients.get(channelName)?.delete(clientId);
      
      // セットが空になった場合はMapからも削除
      if (this.channelClients.get(channelName)?.size === 0) {
        this.channelClients.delete(channelName);
      }
    }
    
    // クライアントの購読情報を削除
    this.clientSubscriptions.delete(clientId);
    
    // Socket.IOのルームから退出
    const socket = this.io.sockets.sockets.get(clientId);
    if (socket) {
      for (const channelName of subscriptions) {
        socket.leave(channelName);
      }
    }
  }

  /**
   * キャッシュされたデータを送信
   * 
   * @param socket Socket.IOソケット
   * @param subscription 購読情報
   */
  private sendCachedData(socket: Socket, subscription: ClientSubscription): void {
    const { symbol, type, timeframe, exchangeType } = subscription;
    
    // キャッシュからデータを取得
    const cachedData = this.getCachedData(type, symbol, timeframe, exchangeType);
    
    // キャッシュデータがある場合は送信
    if (cachedData) {
      const eventName = type.toString();
      const data = {
        symbol,
        exchangeType,
        ...(timeframe ? { timeframe } : {}),
        data: cachedData,
        timestamp: Date.now(),
        cached: true
      };
      
      socket.emit(eventName, data);
      
      logger.debug(`Sent cached ${type} data to client ${socket.id}`, {
        component: 'SocketDataBroadcaster',
        action: 'sendCachedData',
        type,
        symbol,
        timeframe,
        exchangeType
      });
    }
  }

  /**
   * チャンネルの統計情報を取得
   * 
   * @returns チャンネルの統計情報
   */
  public getChannelStats(): ChannelStats[] {
    const stats: ChannelStats[] = [];
    
    for (const [channelName, clients] of this.channelClients.entries()) {
      const messageInfo = this.messageStats.get(channelName) || { count: 0, lastTime: null, size: 0 };
      
      stats.push({
        name: channelName,
        clientCount: clients.size,
        messageCount: messageInfo.count,
        lastBroadcastTime: messageInfo.lastTime,
        dataSize: messageInfo.size
      });
    }
    
    return stats;
  }

  /**
   * クライアントの統計情報を取得
   * 
   * @returns クライアントの統計情報
   */
  public getClientStats(): ClientStats[] {
    const stats: ClientStats[] = [];
    
    for (const [clientId, info] of this.clientInfo.entries()) {
      const subscriptions = this.clientSubscriptions.get(clientId)?.size || 0;
      
      stats.push({
        clientId,
        subscriptions,
        connectedAt: info.connectedAt,
        lastActivity: info.lastActivity,
        ip: info.ip,
        userAgent: info.userAgent
      });
    }
    
    return stats;
  }

  /**
   * キャッシュの統計情報を取得
   * 
   * @returns キャッシュの統計情報
   */
  public getCacheStats(): Record<string, any> {
    return {
      orderBook: this.cache.orderBook.getStats(),
      kline: this.cache.kline.getStats(),
      trade: this.cache.trade.getStats()
    };
  }
}

export default SocketDataBroadcaster;