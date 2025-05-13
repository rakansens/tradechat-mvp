/**
 * services/ws/bitget-client.ts
 * Bitget WebSockets APIクライアント
 * 
 * - 接続状態管理
 * - 30秒ごとのping/pong実装
 * - 接続前のメッセージキューイング
 * - 自動再接続
 */

import { logger } from '@/utils/logger';

// Bitget WebSocket APIエンドポイント
const WSS_URL = 'wss://ws.bitget.com/mix/v1/stream';

/**
 * Bitget WebSocketクライアント
 */
export class BitgetWebSocketClient {
  private ws?: WebSocket;
  private pingTimer?: ReturnType<typeof setInterval>;
  private queue: string[] = [];
  private reconnectTimeout?: ReturnType<typeof setTimeout>;
  private reconnectAttempts: number = 0;
  private isReconnecting: boolean = false;
  private messageHandlers: Array<(data: any) => void> = [];
  
  /**
   * WebSocket接続を開始
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logger.info('WebSocket already connected');
      return;
    }
    
    // 再接続中のフラグ設定
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    try {
      this.ws = new WebSocket(WSS_URL);
      
      this.ws.addEventListener("open", this.handleOpen.bind(this));
      this.ws.addEventListener("message", this.handleMessage.bind(this));
      this.ws.addEventListener("close", this.handleClose.bind(this));
      this.ws.addEventListener("error", this.handleError.bind(this));
      
      logger.info('WebSocket connection initiated');
    } catch (error) {
      logger.error('WebSocket connection error:', error);
      this.reconnect();
    }
  }
  
  /**
   * WebSocket接続が開いたときの処理
   */
  private handleOpen(): void {
    logger.info('WebSocket connection opened');
    
    // ハートビート開始
    this.startHeartbeat();
    
    // 接続中に蓄積されたメッセージを送信
    this.flushQueuedMessages();
    
    // 再接続情報をリセット
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }
  
  /**
   * WebSocketメッセージ受信時の処理
   */
  private handleMessage(event: MessageEvent): void {
    try {
      // "ping"に対して"pong"で応答
      if (event.data === "ping") {
        this.send("pong");
        return;
      }
      
      // データをJSONとしてパース
      const data = JSON.parse(event.data);
      
      // 登録されたすべてのハンドラにデータを渡す
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error('Error in message handler:', error);
        }
      });
    } catch (error) {
      logger.error('Error handling WebSocket message:', error, {
        data: event.data
      });
    }
  }
  
  /**
   * WebSocket接続が閉じられたときの処理
   */
  private handleClose(event: CloseEvent): void {
    logger.warn(`WebSocket connection closed: ${event.code} ${event.reason}`);
    this.cleanup();
    this.reconnect();
  }
  
  /**
   * WebSocketエラー発生時の処理
   */
  private handleError(event: Event): void {
    logger.error('WebSocket error:', event);
    this.cleanup();
    this.reconnect();
  }
  
  /**
   * リソースのクリーンアップ
   */
  private cleanup(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }
  
  /**
   * 再接続処理
   */
  private reconnect(): void {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.reconnectAttempts += 1;
    
    // 指数バックオフを使用（最大30秒）
    const delay = Math.min(
      2000 * Math.pow(1.5, this.reconnectAttempts - 1), 
      30000
    );
    
    logger.info(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  /**
   * ハートビート（ping）を開始
   * Bitgetの仕様: 30秒ごとにping、2分無応答で切断
   */
  private startHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // pingメッセージ送信
        this.ws.send("ping");
        logger.debug('Sent ping');
      }
    }, 25000); // 30秒より少し短い間隔
  }
  
  /**
   * メッセージ送信（接続がない場合はキューイング）
   */
  send(message: any): void {
    const payload = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
      logger.debug('Sent message:', payload);
    } else {
      // 接続が確立するまでメッセージをキューに入れる
      this.queue.push(payload);
      logger.debug('Queued message:', payload);
    }
  }
  
  /**
   * キューに溜まったメッセージを送信
   */
  private flushQueuedMessages(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    while (this.queue.length > 0) {
      const message = this.queue.shift();
      if (message) {
        this.ws.send(message);
        logger.debug('Sent queued message:', message);
      }
    }
  }
  
  /**
   * メッセージハンドラの登録
   */
  onMessage(handler: (data: any) => void): void {
    this.messageHandlers.push(handler);
  }
  
  /**
   * WebSocket接続の切断
   */
  disconnect(): void {
    this.cleanup();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = undefined;
    }
    
    this.queue = [];
    this.messageHandlers = [];
    logger.info('WebSocket disconnected');
  }
  
  /**
   * 接続状態の確認
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// シングルトンインスタンス
let clientInstance: BitgetWebSocketClient | null = null;

/**
 * BitgetWebSocketClientのシングルトンインスタンスを取得
 */
export function getBitgetWebSocketClient(): BitgetWebSocketClient {
  if (!clientInstance) {
    clientInstance = new BitgetWebSocketClient();
  }
  return clientInstance;
} 