/**
 * services/api/bitget/ws-client.ts
 * Bitget WebSocketクライアント
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリング
 * 
 * このファイルは、WebSocket通信を担当します。
 * 接続管理、メッセージ送受信、Ping/Pong処理、再接続ロジックを実装します。
 */

import { BitgetCredentials } from '@/types/api';
import { OHLCData, Timeframe } from '../../../types/chart';
import { OrderBookData } from '@/types/common/orderbook';
import { ExchangeType, ProductType } from '@/types/constants/enums';
import { logger } from '@/utils/common';
import { IS_DEV, getApiConfig } from '@/config/environment';
import { BitgetApiClientOptions } from './interfaces';
import { formatSymbol, createWebSocket, WebSocketSendQueue } from './utils';
import { BitgetDataTransformer } from './data-transformer';
import EventEmitter from 'events';

/**
 * WebSocketクライアントのオプション
 * 更新: 2025-05-17 - ProductTypeとExchangeTypeを明確に分離
 */
export interface WebSocketClientOptions {
  /**
   * WebSocket URL
   */
  wsUrl?: string;
  
  /**
   * API認証情報
   */
  credentials?: BitgetCredentials;
  
  /**
   * 製品タイプ
   */
  productType?: ProductType;
  
  /**
   * 取引タイプ
   */
  exchangeType?: ExchangeType;
}

/**
 * BitgetWebSocketClientクラス
 * WebSocket通信を担当
 */
export class BitgetWebSocketClient extends EventEmitter {
  private wsUrl: string;
  private credentials: BitgetCredentials;
  private productType: ProductType;
  private exchangeType: ExchangeType;
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  private currentSubscription: { instType: string; channel: string; instId: string } | null = null;
  private dataTransformer: BitgetDataTransformer;
  
  // コールバック管理
  private onOrderBookUpdateCallbacks: Map<string, ((data: OrderBookData) => void)[]> = new Map();
  private onKlineUpdateCallbacks: Map<string, ((data: OHLCData) => void)[]> = new Map();
  
  private lastWarnTime: number | null = null;
  
  private sendQueue: WebSocketSendQueue;
  
  /**
   * コンストラクタ
   * @param options WebSocketクライアントのオプション
   */
  constructor(options: WebSocketClientOptions = {}) {
    super();
    
    // API設定を環境設定から取得
    const apiConfig = getApiConfig('bitget');
    
    this.wsUrl = options.wsUrl || apiConfig.wsUrl;
    this.credentials = options.credentials || {};
    this.productType = options.productType || 'spot';
    this.exchangeType = options.exchangeType || 'bitget';
    this.dataTransformer = new BitgetDataTransformer();
    
    // 送信キューを初期化
    this.sendQueue = new WebSocketSendQueue();
    
    logger.info('BitgetWebSocketClient initialized', {
      component: 'BitgetWebSocketClient',
      action: 'constructor',
      exchangeType: this.exchangeType,
      wsUrl: this.wsUrl
    });
  }
  
  /**
   * WebSocket接続を確立
   * @returns 接続完了を示すPromise
   */
  async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        // 既に接続があれば一旦切断
        if (this.ws) {
          this.disconnect();
        }
        
        logger.info('Connecting to Bitget WebSocket', {
          component: 'BitgetWebSocketClient',
          action: 'connect',
          url: this.wsUrl
        });
        
        // WebSocketを作成
        this.ws = createWebSocket(this.wsUrl);
        
        if (!this.ws) {
          const error = new Error('Failed to create WebSocket');
          logger.error('Failed to create WebSocket', error, {
            component: 'BitgetWebSocketClient',
            action: 'connect'
          });
          reject(error);
          return;
        }
        
        // 送信キューにWebSocketをセット
        this.sendQueue.setWebSocket(this.ws);
        
        // 接続成功時のハンドラ
        const onOpen = () => {
          logger.info('Bitget WebSocket connected', {
            component: 'BitgetWebSocketClient',
            action: 'connect'
          });
          
          // ping/pongの設定
          this.setupPingInterval();
          
          // 現在の購読があれば再購読
          if (this.currentSubscription) {
            this.sendSubscription(this.currentSubscription);
          }
          
          // 接続成功イベントを発火
          this.emit('connected');
          
          resolve();
        };
        
        // イベントハンドラを設定
        this.ws.onopen = onOpen;
        this.ws.onmessage = this.handleMessage.bind(this);
        this.ws.onerror = this.handleError.bind(this);
        this.ws.onclose = this.handleClose.bind(this);
      } catch (error) {
        logger.error('Failed to connect to WebSocket', error, {
          component: 'BitgetWebSocketClient',
          action: 'connect'
        });
        reject(error);
      }
    });
  }
  
  /**
   * WebSocket接続を閉じる
   */
  disconnect(): void {
    logger.info('Disconnecting from Bitget WebSocket', {
      component: 'BitgetWebSocketClient',
      action: 'disconnect'
    });
    
    // pingインターバルをクリア
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // 再接続インターバルをクリア
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    // 送信キューを停止
    this.sendQueue.stopQueueProcessor();
    this.sendQueue.clearQueue();
    
    // WebSocketを閉じる
    if (this.ws) {
      try {
        // イベントハンドラをクリア
        this.ws.onopen = null;
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        
        // 接続を閉じる
        this.ws.close();
      } catch (error) {
        logger.error('Error while closing WebSocket', error, {
          component: 'BitgetWebSocketClient',
          action: 'disconnect'
        });
      } finally {
        this.ws = null;
        // WebSocketをnullに設定したことを送信キューに通知
        this.sendQueue.setWebSocket(null);
      }
    }
    
    // 現在の購読情報をクリア
    this.currentSubscription = null;
    
    // 切断イベントを発火
    this.emit('disconnected');
  }
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void
  ): () => void {
    const formattedSymbol = formatSymbol(symbol);
    
    // コールバックを登録
    if (!this.onOrderBookUpdateCallbacks.has(symbol)) {
      this.onOrderBookUpdateCallbacks.set(symbol, []);
    }
    
    const callbacks = this.onOrderBookUpdateCallbacks.get(symbol) || [];
    callbacks.push(callback);
    this.onOrderBookUpdateCallbacks.set(symbol, callbacks);
    
    // 購読情報を作成
    const instId = this.productType === 'spot' ? 
      `${formattedSymbol}_SPBL` : 
      `${formattedSymbol}_UMCBL`;
    
    // 購読リクエストを送信
    const subscription = {
      instType: this.productType.toUpperCase(),
      channel: 'books',
      instId
    };
    
    this.sendSubscription(subscription);
    
    // 購読解除関数を返す
    return () => {
      const currentCallbacks = this.onOrderBookUpdateCallbacks.get(symbol) || [];
      const updatedCallbacks = currentCallbacks.filter(cb => cb !== callback);
      
      if (updatedCallbacks.length) {
        this.onOrderBookUpdateCallbacks.set(symbol, updatedCallbacks);
      } else {
        this.onOrderBookUpdateCallbacks.delete(symbol);
        // 購読解除リクエストを送信（将来的に実装）
      }
    };
  }
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeCandles(
    symbol: string,
    timeframe: string,
    callback: (data: OHLCData) => void
  ): () => void {
    const formattedSymbol = formatSymbol(symbol);
    const key = `${symbol}-${timeframe}`;
    
    // コールバックを登録
    if (!this.onKlineUpdateCallbacks.has(key)) {
      this.onKlineUpdateCallbacks.set(key, []);
    }
    
    const callbacks = this.onKlineUpdateCallbacks.get(key) || [];
    callbacks.push(callback);
    this.onKlineUpdateCallbacks.set(key, callbacks);
    
    // 購読情報を作成
    const instId = this.productType === 'spot' ? 
      `${formattedSymbol}_SPBL` : 
      `${formattedSymbol}_UMCBL`;
    
    // 購読リクエストを送信
    const subscription = {
      instType: this.productType.toUpperCase(),
      channel: `candle${timeframe}`,
      instId
    };
    
    this.sendSubscription(subscription);
    
    // 購読解除関数を返す
    return () => {
      const currentCallbacks = this.onKlineUpdateCallbacks.get(key) || [];
      const updatedCallbacks = currentCallbacks.filter(cb => cb !== callback);
      
      if (updatedCallbacks.length) {
        this.onKlineUpdateCallbacks.set(key, updatedCallbacks);
      } else {
        this.onKlineUpdateCallbacks.delete(key);
        // 購読解除リクエストを送信（将来的に実装）
      }
    };
  }
  
  /**
   * ローソク足データ更新時のコールバックを設定
   * @param callback コールバック関数
   */
  setKlineUpdateCallback(callback: (data: OHLCData) => void): void {
    logger.info('Setting kline update callback', {
      component: 'BitgetWebSocketClient',
      action: 'setKlineUpdateCallback'
    });
    
    // すべてのローソク足データのコールバックを登録
    for (const key of this.onKlineUpdateCallbacks.keys()) {
      const callbacks = this.onKlineUpdateCallbacks.get(key) || [];
      
      // 重複登録を避ける
      if (!callbacks.includes(callback)) {
        callbacks.push(callback);
        this.onKlineUpdateCallbacks.set(key, callbacks);
      }
    }
    
    // グローバルコールバックとしてイベントリスナーを設定
    this.on('klineUpdate', callback);
  }
  
  /**
   * WebSocketメッセージ受信時のハンドラ
   * @param event メッセージイベント
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data.toString());
      
      if (IS_DEV) {
        logger.debug('WebSocket message received', {
          component: 'BitgetWebSocketClient',
          action: 'handleMessage',
          data
        });
      }
      
      // Pingメッセージに対してPongで応答
      if (data.op === 'ping') {
        this.sendPong();
        return;
      }
      
      // 購読確認メッセージ
      if (data.event === 'subscribe') {
        logger.info('Subscription confirmed', {
          component: 'BitgetWebSocketClient',
          action: 'handleMessage',
          channel: data.arg?.channel,
          symbol: data.arg?.instId
        });
        return;
      }
      
      // データメッセージ
      if (data.data && data.arg) {
        this.processUpdateMessage(data);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', error, {
        component: 'BitgetWebSocketClient',
        action: 'handleMessage',
        data: event.data
      });
    }
  }
  
  /**
   * 更新メッセージを処理
   * @param data 受信データ
   */
  private processUpdateMessage(data: any): void {
    try {
      // チャンネル情報を取得
      const arg = data.arg || {};
      const channel = arg.channel || '';
      const instId = arg.instId || '';
      
      // データ本体を取得
      const messageData = data.data || [];
      
      // チャンネルに応じて処理を分岐
      if (channel.startsWith('candle')) {
        // ローソク足データの処理
        this.processKlineData(messageData, instId, channel);
      } else if (channel === 'books') {
        // オーダーブックデータの処理
        this.processOrderBookData(messageData, instId);
      } else {
        logger.debug('Unhandled channel type', {
          component: 'BitgetWebSocketClient',
          action: 'processUpdateMessage',
          channel,
          instId
        });
      }
    } catch (error) {
      logger.error('Error processing update message', error, {
        component: 'BitgetWebSocketClient',
        action: 'processUpdateMessage',
        data
      });
    }
  }
  
  /**
   * ローソク足データを処理
   * @param data 受信データ
   * @param instId 銘柄ID
   * @param channel チャンネル
   */
  private processKlineData(data: any[], instId: string, channel: string): void {
    if (!data.length) return;
    
    try {
      // タイムフレームを抽出（例: candle1m -> 1m）
      const timeframe = channel.replace('candle', '');
      
      // シンボルを正規化
      const symbol = this.normalizeSymbol(instId);
      const key = `${symbol}-${timeframe}`;
      
      // コールバックを取得
      const callbacks = this.onKlineUpdateCallbacks.get(key) || [];
      if (!callbacks.length) return;
      
      // データを変換
      const candle = this.dataTransformer.extractCandleFromWsMessage(data, instId, channel);
      if (!candle) return;
      
      // コールバックを呼び出し
      callbacks.forEach(callback => {
        try {
          callback(candle);
        } catch (callbackError) {
          logger.error('Error in candle callback', callbackError, {
            component: 'BitgetWebSocketClient',
            action: 'processKlineData'
          });
        }
      });
      
      // グローバルイベントとしてklineUpdateイベントを発火
      this.emit('klineUpdate', candle);
      
      logger.debug('Emitted klineUpdate event', {
        component: 'BitgetWebSocketClient',
        action: 'processKlineData',
        symbol,
        timeframe
      });
    } catch (error) {
      logger.error('Error processing kline data', error, {
        component: 'BitgetWebSocketClient',
        action: 'processKlineData',
        data
      });
    }
  }
  
  /**
   * オーダーブックデータを処理
   * @param data 受信データ
   * @param instId 銘柄ID
   */
  private processOrderBookData(data: any[], instId: string): void {
    if (!data.length) return;
    
    try {
      // シンボルを正規化
      const symbol = this.normalizeSymbol(instId);
      
      // コールバックを取得
      const callbacks = this.onOrderBookUpdateCallbacks.get(symbol) || [];
      if (!callbacks.length) return;
      
      // データを変換
      const orderBook = this.dataTransformer.extractOrderBookFromWsMessage(data[0], symbol);
      if (!orderBook) return;
      
      // コールバックを呼び出し
      callbacks.forEach(callback => {
        try {
          callback(orderBook);
        } catch (callbackError) {
          logger.error('Error in orderbook callback', callbackError, {
            component: 'BitgetWebSocketClient',
            action: 'processOrderBookData'
          });
        }
      });
    } catch (error) {
      logger.error('Error processing order book data', error, {
        component: 'BitgetWebSocketClient',
        action: 'processOrderBookData',
        data
      });
    }
  }
  
  /**
   * Pongメッセージを送信
   */
  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op: 'pong' }));
      
      if (IS_DEV) {
        logger.debug('Pong sent', {
          component: 'BitgetWebSocketClient',
          action: 'sendPong'
        });
      }
    }
  }
  
  /**
   * WebSocketエラー時のハンドラ
   * @param event エラーイベント
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error', null, {
      component: 'BitgetWebSocketClient',
      action: 'handleError',
      event
    });
    
    // エラーイベントを発火
    this.emit('error', event);
  }
  
  /**
   * WebSocket切断時のハンドラ
   * @param event クローズイベント
   */
  private handleClose(event: CloseEvent): void {
    logger.info('WebSocket connection closed', {
      component: 'BitgetWebSocketClient',
      action: 'handleClose',
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });
    
    // 切断イベントを発火
    this.emit('close', event);
    
    // クリーンな切断でない場合は再接続を試みる
    if (!event.wasClean) {
      this.setupReconnect();
    }
  }
  
  /**
   * pingインターバルを設定
   */
  private setupPingInterval(): void {
    // 既存のインターバルをクリア
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // 20秒ごとにpingを送信
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const pingMessage = JSON.stringify({ op: 'ping' });
          this.ws.send(pingMessage);
          
          if (IS_DEV) {
            logger.debug('Sent ping', {
              component: 'BitgetWebSocketClient',
              action: 'setupPingInterval'
            });
          }
        } catch (error) {
          logger.error('Error sending ping', error, {
            component: 'BitgetWebSocketClient',
            action: 'setupPingInterval'
          });
          
          // エラーが発生した場合は再接続を試みる
          this.disconnect();
          this.setupReconnect();
        }
      }
    }, 20000); // 20秒間隔
  }
  
  /**
   * 再接続を設定
   */
  private setupReconnect(): void {
    // 既存の再接続タイマーをクリア
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    logger.info('Setting up WebSocket reconnection', {
      component: 'BitgetWebSocketClient',
      action: 'setupReconnect'
    });
    
    // 5秒後に再接続
    this.reconnectInterval = setTimeout(() => {
      logger.info('Attempting to reconnect WebSocket', {
        component: 'BitgetWebSocketClient',
        action: 'setupReconnect'
      });
      
      try {
        this.connect();
      } catch (error) {
        logger.error('Failed to reconnect WebSocket', error, {
          component: 'BitgetWebSocketClient',
          action: 'setupReconnect'
        });
        
        // 再度再接続を設定
        this.setupReconnect();
      }
    }, 5000); // 5秒後
  }
  
  /**
   * シンボルを正規化
   * @param instId 銘柄ID
   * @returns 正規化されたシンボル
   */
  private normalizeSymbol(instId: string): string {
    // BTC-USDT_SPBL -> BTC/USDT
    // BTC-USDT_UMCBL -> BTC/USDT
    const match = instId.match(/([A-Z0-9]+)-([A-Z0-9]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return instId;
  }
  
  /**
   * 購読リクエストを送信
   * @param subscription 購読情報
   */
  private sendSubscription(subscription: { instType: string; channel: string; instId: string }): void {
    // メッセージを作成
    const message = {
        op: 'subscribe',
        args: [subscription]
    };
    
    // 送信キューを使用してメッセージを送信
    this.sendQueue.send(message);
      
    // 現在の購読情報を保存
      this.currentSubscription = subscription;
      
    logger.debug('Subscription queued', {
        component: 'BitgetWebSocketClient',
        action: 'sendSubscription',
      subscription,
      queueSize: this.sendQueue.getQueueSize()
    });
  }
  
  /**
   * イベントリスナーを登録
   * @param event イベント名
   * @param listener リスナー関数
   */
  on(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
  
  /**
   * イベントリスナーを削除
   * @param event イベント名
   * @param listener リスナー関数
   */
  off(event: string, listener: (...args: any[]) => void): this {
    return super.off(event, listener);
  }
}
