/**
 * server/bitgetWebSocketManager.ts
 * Bitget WebSocketとの単一接続を管理するマネージャークラス
 * 
 * 改善点:
 * - サブスクリプションキーの重複防止(一貫した文字列形式使用)
 * - 再接続前にws.terminate()を確実に実行
 * - Ping/Pong処理の最適化
 * - タイムフレーム変換をユーティリティに移動
 */

import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ExchangeType } from '../types/api';
import { logger } from '@/utils/common';
import { getApiConfig } from '../services/api/common/environment';
import { toBitget, fromBitget } from '../utils/timeframe';

// 接続状態の定義
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

// サブスクリプションの型定義
interface Subscription {
  instType: string; // 'SP'(spot) または 'MC'(futures)
  channel: string;  // 'candle1m', 'books', 'trade' など
  instId: string;   // シンボル (例: 'BTCUSDT' または 'BTCUSDT_UMCBL')
}

// 再接続設定の型定義
interface ReconnectConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
}

/**
 * Bitget WebSocketマネージャークラス
 * 
 * Bitget WebSocketとの単一接続を管理し、複数シンボルの購読を一元管理します。
 * EventEmitterを継承し、データ受信時にイベントを発行します。
 */
export class BitgetWebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private subscriptions: Map<string, Set<string>> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private readonly reconnectConfig: ReconnectConfig = {
    maxAttempts: 10,
    baseDelay: 1000,
    maxDelay: 30000,
    jitter: true
  };
  private readonly wsUrl: string;

  /**
   * BitgetWebSocketManagerを初期化
   * 
   * @param wsUrl WebSocketのURL（指定がない場合はgetApiConfig()から取得）
   */
  constructor(wsUrl?: string) {
    super();
    this.wsUrl = wsUrl || getApiConfig('bitget').wsUrl;
  }

  /**
   * WebSocket接続を開始
   */
  public connect(): void {
    if (this.connectionState === ConnectionState.CONNECTED || 
        this.connectionState === ConnectionState.CONNECTING) {
      logger.info('WebSocket is already connected or connecting', {
        component: 'BitgetWebSocketManager',
        action: 'connect'
      });
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    
    try {
      logger.info(`Connecting to Bitget WebSocket: ${this.wsUrl}`, {
        component: 'BitgetWebSocketManager',
        action: 'connect'
      });
      
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', this.handleOpen.bind(this));
      this.ws.on('message', this.handleMessage.bind(this));
      this.ws.on('error', this.handleError.bind(this));
      this.ws.on('close', this.handleClose.bind(this));
      
      // Bitgetの公式仕様に従ってpingハンドラを追加
      this.ws.on('ping', (data) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.pong(data);
        }
      });
    } catch (error) {
      logger.error('Failed to connect to WebSocket', error, {
        component: 'BitgetWebSocketManager',
        action: 'connect'
      });
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket接続を閉じる
   */
  public disconnect(): void {
    logger.info('Disconnecting from Bitget WebSocket', {
      component: 'BitgetWebSocketManager',
      action: 'disconnect'
    });
    
    this.clearTimers();
    
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    
    this.connectionState = ConnectionState.DISCONNECTED;
  }

  /**
   * チャンネルを購読
   * 
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param type チャンネルタイプ（'orderbook', 'kline', 'trade'）
   * @param timeframe タイムフレーム（klineの場合のみ必要）
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読に成功した場合はtrue、失敗した場合はfalse
   */
  public subscribe(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType: ExchangeType = 'spot'
  ): boolean {
    try {
      // シンボルの正規化
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      
      // instType（取引タイプ）の設定
      const instType = exchangeType === 'spot' ? 'SP' : 'MC';
      
      // instId（シンボルID）の設定
      const instId = exchangeType === 'spot'
        ? formattedSymbol
        : `${formattedSymbol}_UMCBL`;
      
      // チャンネル名の設定
      let channel: string;
      switch (type) {
        case 'orderbook':
          channel = 'books';
          break;
        case 'kline':
          if (!timeframe) {
            throw new Error('Timeframe is required for kline subscription');
          }
          channel = `candle${toBitget(timeframe)}`;
          break;
        case 'trade':
          channel = 'trade';
          break;
        default:
          throw new Error(`Unsupported channel type: ${type}`);
      }
      
      // サブスクリプションの作成
      const subscription: Subscription = {
        instType,
        channel,
        instId
      };
      
      // サブスクリプションキーの生成
      const subKey = this.getSubscriptionKey(subscription);
      
      // サブスクリプションの保存
      if (!this.subscriptions.has(subKey)) {
        this.subscriptions.set(subKey, new Set<string>());
      }
      
      // サブスクリプションIDの生成と保存
      const subId = this.generateSubscriptionId(subscription);
      this.subscriptions.get(subKey)?.add(subId);
      
      // WebSocketが接続されている場合は購読メッセージを送信
      if (this.connectionState === ConnectionState.CONNECTED && this.ws) {
        this.sendSubscription(subscription);
      }
      
      logger.info(`Subscribed to ${type} for ${symbol} (${exchangeType})`, {
        component: 'BitgetWebSocketManager',
        action: 'subscribe',
        subscription
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to subscribe to ${type} for ${symbol}`, error, {
        component: 'BitgetWebSocketManager',
        action: 'subscribe'
      });
      return false;
    }
  }

  /**
   * チャンネルの購読を解除
   * 
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param type チャンネルタイプ（'orderbook', 'kline', 'trade'）
   * @param timeframe タイムフレーム（klineの場合のみ必要）
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除に成功した場合はtrue、失敗した場合はfalse
   */
  public unsubscribe(
    symbol: string,
    type: string,
    timeframe?: string,
    exchangeType: ExchangeType = 'spot'
  ): boolean {
    try {
      // シンボルの正規化
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      
      // instType（取引タイプ）の設定
      const instType = exchangeType === 'spot' ? 'SP' : 'MC';
      
      // instId（シンボルID）の設定
      const instId = exchangeType === 'spot'
        ? formattedSymbol
        : `${formattedSymbol}_UMCBL`;
      
      // チャンネル名の設定
      let channel: string;
      switch (type) {
        case 'orderbook':
          channel = 'books';
          break;
        case 'kline':
          if (!timeframe) {
            throw new Error('Timeframe is required for kline subscription');
          }
          channel = `candle${toBitget(timeframe)}`;
          break;
        case 'trade':
          channel = 'trade';
          break;
        default:
          throw new Error(`Unsupported channel type: ${type}`);
      }
      
      // サブスクリプションの作成
      const subscription: Subscription = {
        instType,
        channel,
        instId
      };
      
      // サブスクリプションキーの生成
      const subKey = this.getSubscriptionKey(subscription);
      
      // サブスクリプションの削除
      if (this.subscriptions.has(subKey)) {
        const subId = this.generateSubscriptionId(subscription);
        const subs = this.subscriptions.get(subKey);
        
        if (subs) {
          subs.delete(subId);
          
          // セットが空になった場合はMapからも削除
          if (subs.size === 0) {
            this.subscriptions.delete(subKey);
          }
        }
      }
      
      // WebSocketが接続されている場合は購読解除メッセージを送信
      if (this.connectionState === ConnectionState.CONNECTED && this.ws) {
        this.sendUnsubscription(subscription);
      }
      
      logger.info(`Unsubscribed from ${type} for ${symbol} (${exchangeType})`, {
        component: 'BitgetWebSocketManager',
        action: 'unsubscribe',
        subscription
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to unsubscribe from ${type} for ${symbol}`, error, {
        component: 'BitgetWebSocketManager',
        action: 'unsubscribe'
      });
      return false;
    }
  }

  /**
   * 現在のサブスクリプション一覧を取得
   * 
   * @returns サブスクリプションの配列
   */
  public getSubscriptions(): Subscription[] {
    const result: Subscription[] = [];
    const processedKeys = new Set<string>();
    
    for (const subs of this.subscriptions.values()) {
      for (const subId of subs) {
        // subIdから基本情報を抽出
        const [instType, channel, instId] = subId.split(':');
        const key = `${instType}:${channel}:${instId}`;
        
        // 重複を避けるために既に処理したキーをスキップ
        if (!processedKeys.has(key)) {
          processedKeys.add(key);
          result.push({ instType, channel, instId });
        }
      }
    }
    
    return result;
  }

  /**
   * 接続状態を取得
   * 
   * @returns 現在の接続状態
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * WebSocketの接続状態を確認
   * 
   * @returns 接続されている場合はtrue、そうでない場合はfalse
   */
  public isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  /**
   * WebSocketの接続が開いたときのハンドラ
   */
  private handleOpen(): void {
    logger.info('WebSocket connection established', {
      component: 'BitgetWebSocketManager',
      action: 'handleOpen'
    });
    
    this.connectionState = ConnectionState.CONNECTED;
    this.reconnectAttempts = 0;
    
    // Ping間隔の設定は不要 - Bitget側から20秒ごとにpingが送信される
    
    // 保存されているすべてのサブスクリプションを再購読
    this.resubscribeAll();
    
    // 接続成功イベントを発行
    this.emit('connected');
  }

  /**
   * WebSocketからメッセージを受信したときのハンドラ
   * 
   * @param data 受信したデータ
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      // 文字列以外のデータ形式は現在サポートしていない
      if (typeof data !== 'string') {
        logger.warn('Received non-string message from WebSocket', {
          component: 'BitgetWebSocketManager',
          action: 'handleMessage',
          dataType: typeof data
        });
        return;
      }
      
      // pingメッセージの処理（ただしpingイベントは別途ws.on('ping')で処理）
      if (data === 'ping') {
        this.sendPong();
        return;
      }
      
      // JSONデータのパース
      const message = JSON.parse(data);
      
      // イベントメッセージの処理
      if (message.event) {
        this.handleEventMessage(message);
        return;
      }
      
      // データメッセージの処理
      if (message.arg && message.data) {
        this.handleDataMessage(message);
        return;
      }
      
      // その他のメッセージ
      logger.debug('Received unknown message format', {
        component: 'BitgetWebSocketManager',
        action: 'handleMessage',
        message
      });
    } catch (error) {
      logger.error('Error handling WebSocket message', error, {
        component: 'BitgetWebSocketManager',
        action: 'handleMessage',
        data: typeof data === 'string' ? data.substring(0, 100) : typeof data
      });
    }
  }

  /**
   * イベントメッセージの処理
   * 
   * @param message イベントメッセージ
   */
  private handleEventMessage(message: any): void {
    const { event, code, msg } = message;
    
    switch (event) {
      case 'subscribe':
        if (code === '0') {
          logger.info(`Successfully subscribed: ${JSON.stringify(message.arg)}`, {
            component: 'BitgetWebSocketManager',
            action: 'handleEventMessage'
          });
        } else {
          logger.warn(`Subscription failed: ${msg}`, {
            component: 'BitgetWebSocketManager',
            action: 'handleEventMessage',
            code,
            message
          });
        }
        break;
        
      case 'unsubscribe':
        if (code === '0') {
          logger.info(`Successfully unsubscribed: ${JSON.stringify(message.arg)}`, {
            component: 'BitgetWebSocketManager',
            action: 'handleEventMessage'
          });
        } else {
          logger.warn(`Unsubscription failed: ${msg}`, {
            component: 'BitgetWebSocketManager',
            action: 'handleEventMessage',
            code,
            message
          });
        }
        break;
        
      case 'error':
        logger.error(`WebSocket error event: ${msg}`, {
          component: 'BitgetWebSocketManager',
          action: 'handleEventMessage',
          code,
          message
        });
        break;
        
      default:
        logger.debug(`Unknown event: ${event}`, {
          component: 'BitgetWebSocketManager',
          action: 'handleEventMessage',
          message
        });
    }
  }

  /**
   * データメッセージの処理
   * 
   * @param message データメッセージ
   */
  private handleDataMessage(message: any): void {
    const { arg, data } = message;
    
    if (!arg || !arg.channel || !arg.instId) {
      logger.warn('Invalid data message format', {
        component: 'BitgetWebSocketManager',
        action: 'handleDataMessage',
        message
      });
      return;
    }
    
    const { channel, instId, instType } = arg;
    
    // シンボルの抽出（_UMCBLサフィックスを削除）
    const symbol = instId.replace('_UMCBL', '');
    
    // 取引タイプの判定
    const exchangeType: ExchangeType = instType === 'SP' ? 'spot' : 'futures';
    
    // チャンネルタイプとタイムフレームの抽出
    let type: string;
    let timeframe: string | undefined;
    
    if (channel === 'books') {
      type = 'orderbook';
    } else if (channel === 'trade') {
      type = 'trade';
    } else if (channel.startsWith('candle')) {
      type = 'kline';
      timeframe = fromBitget(channel.replace('candle', ''));
    } else {
      logger.warn(`Unknown channel: ${channel}`, {
        component: 'BitgetWebSocketManager',
        action: 'handleDataMessage'
      });
      return;
    }
    
    // データの処理とイベント発行
    try {
      switch (type) {
        case 'orderbook':
          this.emit('orderbook', {
            symbol,
            exchangeType,
            data
          });
          break;
          
        case 'kline':
          this.emit('kline', {
            symbol,
            timeframe,
            exchangeType,
            data,
            channel
          });
          break;
          
        case 'trade':
          this.emit('trade', {
            symbol,
            exchangeType,
            data
          });
          break;
      }
    } catch (error) {
      logger.error(`Error emitting ${type} event`, error, {
        component: 'BitgetWebSocketManager',
        action: 'handleDataMessage',
        type,
        symbol,
        exchangeType
      });
    }
  }

  /**
   * WebSocketでエラーが発生したときのハンドラ
   * 
   * @param error 発生したエラー
   */
  private handleError(error: Error): void {
    logger.error('WebSocket error', error, {
      component: 'BitgetWebSocketManager',
      action: 'handleError'
    });
    
    // エラーイベントを発行
    this.emit('error', error);
  }

  /**
   * WebSocket接続が閉じたときのハンドラ
   * 
   * @param code クローズコード
   * @param reason クローズ理由
   */
  private handleClose(code: number, reason: string): void {
    logger.info(`WebSocket connection closed: ${code} ${reason}`, {
      component: 'BitgetWebSocketManager',
      action: 'handleClose'
    });
    
    this.clearTimers();
    this.ws = null; // 明示的にnullに設定
    
    // 正常終了（コード1000）でない場合は再接続
    if (code !== 1000) {
      this.scheduleReconnect();
    } else {
      this.connectionState = ConnectionState.DISCONNECTED;
    }
    
    // 切断イベントを発行
    this.emit('disconnected', { code, reason });
  }

  /**
   * Ping間隔の設定
   */
  private setupPingInterval(): void {
    // 既存のPing間隔をクリア
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // 新しいPing間隔を設定（15秒ごと）
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 15000);
  }

  /**
   * Pingメッセージの送信
   */
  private sendPing(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
    }
  }

  /**
   * Pongメッセージの送信
   */
  private sendPong(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('pong');
    }
  }

  /**
   * 購読メッセージの送信
   * 
   * @param subscription 購読情報
   */
  private sendSubscription(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const message = {
      op: 'subscribe',
      args: [subscription]
    };
    
    this.ws.send(JSON.stringify(message));
    
    logger.debug(`Sent subscription: ${JSON.stringify(subscription)}`, {
      component: 'BitgetWebSocketManager',
      action: 'sendSubscription'
    });
  }

  /**
   * 購読解除メッセージの送信
   * 
   * @param subscription 購読情報
   */
  private sendUnsubscription(subscription: Subscription): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    const message = {
      op: 'unsubscribe',
      args: [subscription]
    };
    
    this.ws.send(JSON.stringify(message));
    
    logger.debug(`Sent unsubscription: ${JSON.stringify(subscription)}`, {
      component: 'BitgetWebSocketManager',
      action: 'sendUnsubscription'
    });
  }

  /**
   * すべてのサブスクリプションを再購読
   */
  private resubscribeAll(): void {
    for (const subs of this.subscriptions.values()) {
      for (const subId of subs) {
        try {
          // subIdはコロン区切り文字列なのでsplitして再構築
          const [instType, channel, instId] = subId.split(':');
          
          // 各コンポーネントが存在することを確認
          if (!instType || !channel || !instId) {
            logger.warn(`Invalid subscription ID format: ${subId}`, {
              component: 'BitgetWebSocketManager',
              action: 'resubscribeAll'
            });
            continue;
          }
          
          const subscription: Subscription = { instType, channel, instId };
          this.sendSubscription(subscription);
        } catch (error) {
          logger.error(`Failed to resubscribe: ${subId}`, error, {
            component: 'BitgetWebSocketManager',
            action: 'resubscribeAll'
          });
        }
      }
    }
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    // 既存の接続を確実にクローズ
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch (error) {
        // エラーオブジェクトをそのまま渡さず、文字列化してloggerに渡す
        logger.warn(`Error terminating WebSocket connection: ${error}`, {
          component: 'BitgetWebSocketManager',
          action: 'scheduleReconnect'
        });
      }
      this.ws = null;
    }
    
    // 既に再接続がスケジュールされている場合は何もしない
    if (this.reconnectTimer || this.connectionState === ConnectionState.RECONNECTING) {
      return;
    }
    
    this.connectionState = ConnectionState.RECONNECTING;
    
    // 再接続試行回数が上限に達した場合は再接続を停止
    if (this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
      logger.error(`Maximum reconnection attempts (${this.reconnectConfig.maxAttempts}) reached`, {
        component: 'BitgetWebSocketManager',
        action: 'scheduleReconnect'
      });
      
      this.connectionState = ConnectionState.DISCONNECTED;
      this.emit('reconnect_failed');
      return;
    }
    
    // 指数バックオフ+ジッターによる再接続遅延の計算
    const delay = this.calculateReconnectDelay();
    
    logger.info(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.reconnectConfig.maxAttempts})`, {
      component: 'BitgetWebSocketManager',
      action: 'scheduleReconnect'
    });
    
    // 再接続タイマーの設定
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      
      logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts})`, {
        component: 'BitgetWebSocketManager',
        action: 'reconnect'
      });
      
      this.connect();
    }, delay);
  }

  /**
   * 再接続遅延時間の計算（指数バックオフ+ジッター）
   * 
   * @returns 遅延時間（ミリ秒）
   */
  private calculateReconnectDelay(): number {
    const { baseDelay, maxDelay, jitter } = this.reconnectConfig;
    
    // 指数バックオフの計算
    const exponentialDelay = Math.min(
      maxDelay,
      baseDelay * Math.pow(2, this.reconnectAttempts)
    );
    
    // ジッターの追加（0.5〜1.5倍）
    if (jitter) {
      const jitterMultiplier = 0.5 + Math.random();
      return Math.floor(exponentialDelay * jitterMultiplier);
    }
    
    return exponentialDelay;
  }

  /**
   * タイマーのクリア
   */
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * サブスクリプションキーの生成
   * 
   * @param subscription サブスクリプション情報
   * @returns サブスクリプションキー
   */
  private getSubscriptionKey(subscription: Subscription): string {
    return `${subscription.instType}:${subscription.channel}:${subscription.instId}`;
  }

  /**
   * サブスクリプションIDの生成
   * プロパティの順序を一定にして一意のIDを生成
   * 
   * @param subscription サブスクリプション情報
   * @returns サブスクリプションID
   */
  private generateSubscriptionId(subscription: Subscription): string {
    // 固定形式の文字列を生成
    return `${subscription.instType}:${subscription.channel}:${subscription.instId}`;
  }

  /**
   * タイムフレームをBitget形式に変換
   * 
   * @param timeframe タイムフレーム（例: '1m', '1h', '1d'）
   * @returns Bitget形式のタイムフレーム
   */
  private convertTimeframe(timeframe: string): string {
    return toBitget(timeframe);
  }

  /**
   * Bitget形式のタイムフレームを標準形式に変換
   * 
   * @param bitgetTimeframe Bitget形式のタイムフレーム
   * @returns 標準形式のタイムフレーム
   */
  private reverseTimeframe(bitgetTimeframe: string): string {
    return fromBitget(bitgetTimeframe);
  }
}

export default BitgetWebSocketManager;