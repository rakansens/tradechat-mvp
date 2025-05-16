/**
 * services/api/bitget/websocket-client.ts
 * BitgetのWebSocketクライアント実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたBitget WebSocketクライアントの実装
 * 
 * このファイルは、IWebSocketClientインターフェースに準拠したBitgetのWebSocketクライアントを実装します。
 * 単一責任の原則（SRP）に基づき、WebSocketを使用したリアルタイムデータの取得のみに責任を持ちます。
 */

import { EventEmitter } from 'events';
import { Timeframe } from '../../../types/chart';
import { IWebSocketClient } from '../interfaces';
import { logger } from '../../../utils/logger';

// 環境検出
const isNodeJS = typeof window === 'undefined';

// Node.js環境でのみwsをインポート
let WebSocketImpl: any = null;
if (isNodeJS) {
  try {
    WebSocketImpl = require('ws');
  } catch (e) {
    logger.error('Failed to import ws in Node.js environment', e);
  }
} else {
  // ブラウザ環境ではネイティブのWebSocketを使用
  WebSocketImpl = WebSocket;
}

// Bitget APIのエンドポイント
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';

// タイムフレームのマッピング
const TIMEFRAME_MAP: { [key: string]: string } = {
  '1m': 'candle1m',
  '5m': 'candle5m',
  '15m': 'candle15m',
  '30m': 'candle30m',
  '1h': 'candle1H',
  '4h': 'candle4H',
  '12h': 'candle12H',
  '1d': 'candle1D',
  '1w': 'candle1W'
};

/**
 * BitgetのWebSocketクライアント
 * IWebSocketClientインターフェースを実装
 */
export class BitgetWebSocketClient extends EventEmitter implements IWebSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  /**
   * コンストラクタ
   */
  constructor() {
    super();
  }
  
  /**
   * WebSocket接続を確立
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug('Bitget WebSocketに接続中...');
        
        // 環境に応じたWebSocketの作成
        if (isNodeJS && WebSocketImpl) {
          this.ws = new WebSocketImpl(BITGET_WS_ENDPOINT);
          
          // Node.js環境でのイベントハンドラ設定
          // TypeScriptの型チェックを回避するためにasを使用
          const nodeWs = this.ws as unknown as {
            on(event: string, listener: (...args: any[]) => void): void;
          };
          
          nodeWs.on('open', () => {
            this.handleOpen();
            resolve();
          });
          
          nodeWs.on('message', (data: any) => {
            this.handleMessage(typeof data === 'string' ? data : data.toString());
          });
          
          nodeWs.on('error', (error: any) => {
            this.handleError(error);
            reject(error);
          });
          
          nodeWs.on('close', (code: number, reason: string) => {
            this.handleClose(code, reason);
          });
        } else {
          // ブラウザ環境でのWebSocket作成
          this.ws = new WebSocket(BITGET_WS_ENDPOINT);
          
          // ブラウザ環境でのイベントハンドラ設定
          if (this.ws) {
            this.ws.onopen = () => {
              this.handleOpen();
              resolve();
            };
            
            this.ws.onmessage = (event) => {
              this.handleMessage(event.data);
            };
            
            this.ws.onerror = (error) => {
              this.handleError(error);
              reject(error);
            };
            
            this.ws.onclose = (event) => {
              this.handleClose(event.code, event.reason);
            };
          } else {
            const error = new Error('WebSocketの作成に失敗しました');
            this.handleError(error);
            reject(error);
          }
        }
      } catch (error) {
        logger.error(`接続エラー: ${error}`);
        reject(error);
      }
    });
  }
  
  /**
   * WebSocket接続を閉じる
   */
  public disconnect(): void {
    if (this.ws) {
      this.clearPingInterval();
      this.clearReconnectTimeout();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.subscriptions.clear();
      
      logger.debug('WebSocket接続を閉じました');
    }
  }
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル
   * @returns 購読解除用の関数
   */
  public subscribeOrderBook(symbol: string): () => void {
    const subscriptionKey = `orderbook:${symbol}`;
    this.subscriptions.add(subscriptionKey);
    
    if (this.isConnected) {
      // 最新のBitget WebSocket仕様に合わせたリクエスト形式
      const message = {
        op: "subscribe",
        args: [
          {
            instType: "sp",
            channel: "books",
            instId: symbol
          }
        ]
      };
      this.send(message);
      logger.debug(`オーダーブック購読開始: ${symbol}`);
    }
    
    // 購読解除関数を返す
    return () => {
      this.subscriptions.delete(subscriptionKey);
      logger.debug(`オーダーブック購読解除: ${symbol}`);
    };
  }
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @returns 購読解除用の関数
   */
  public subscribeCandles(symbol: string, timeframe: Timeframe): () => void {
    const channel = TIMEFRAME_MAP[timeframe];
    if (!channel) {
      logger.error(`未対応のタイムフレーム: ${timeframe}`);
      return () => {};
    }
    
    const subscriptionKey = `candles:${symbol}:${timeframe}`;
    this.subscriptions.add(subscriptionKey);
    
    if (this.isConnected) {
      // 最新のBitget WebSocket仕様に合わせたリクエスト形式
      const message = {
        op: "subscribe",
        args: [
          {
            instType: "sp",
            channel: channel,
            instId: symbol
          }
        ]
      };
      this.send(message);
      logger.debug(`ローソク足データ購読開始: ${symbol} ${timeframe}`);
    }
    
    // 購読解除関数を返す
    return () => {
      this.subscriptions.delete(subscriptionKey);
      logger.debug(`ローソク足データ購読解除: ${symbol} ${timeframe}`);
    };
  }
  
  /**
   * 接続オープン時の処理
   */
  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.setupPingInterval();
    this.resubscribeAll();
    
    logger.info('WebSocket接続が確立されました');
    this.emit('connected');
  }
  
  /**
   * メッセージ受信時の処理
   */
  private handleMessage(data: string): void {
    try {
      // "pong"メッセージの処理
      if (data === "pong") {
        this.emit('pong');
        return;
      }
      
      // JSONメッセージの処理
      const message = JSON.parse(data);
      
      // エラーメッセージの処理
      if (message.event === 'error' || (message.code && message.code !== '0')) {
        logger.error('エラーメッセージを受信しました:', message);
        this.emit('error', message);
        return;
      }
      
      // データメッセージの処理
      if (message.arg && message.data) {
        const { instId, channel } = message.arg;
        
        // オーダーブックデータの処理
        if (channel === 'books') {
          const orderBookData = {
            asks: message.data.asks || [],
            bids: message.data.bids || [],
            timestamp: Date.now()
          };
          
          this.emit('orderbook', instId, orderBookData);
        }
        
        // ローソク足データの処理
        if (channel && channel.startsWith('candle') && Array.isArray(message.data)) {
          // タイムフレームを抽出
          const timeframe = Object.keys(TIMEFRAME_MAP).find(
            key => TIMEFRAME_MAP[key] === channel
          );
          
          if (timeframe && message.data.length > 0) {
            const candle = message.data[0];
            const candleData = {
              timestamp: parseInt(candle[0]),
              open: parseFloat(candle[1]),
              high: parseFloat(candle[2]),
              low: parseFloat(candle[3]),
              close: parseFloat(candle[4]),
              volume: parseFloat(candle[5])
            };
            
            this.emit('candle', instId, timeframe, candleData);
          }
        }
      }
    } catch (error) {
      logger.error(`メッセージの解析に失敗: ${error}`);
      this.emit('error', error);
    }
  }
  
  /**
   * エラー発生時の処理
   */
  private handleError(error: any): void {
    logger.error(`WebSocketエラー: ${error}`);
    this.emit('error', error);
  }
  
  /**
   * 接続クローズ時の処理
   */
  private handleClose(code: number, reason: string): void {
    this.isConnected = false;
    this.clearPingInterval();
    
    logger.info(`WebSocket接続が閉じられました (コード: ${code}, 理由: ${reason})`);
    this.emit('disconnected', code, reason);
    
    this.attemptReconnect();
  }
  
  /**
   * WebSocketメッセージを送信
   */
  private send(message: any): void {
    if (this.ws && this.isConnected) {
      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        this.ws.send(messageStr);
      } catch (error) {
        logger.error(`メッセージ送信エラー: ${error}`);
        this.emit('error', error);
      }
    } else {
      logger.error('接続が確立されていないため、メッセージを送信できません');
    }
  }
  
  /**
   * Pingを送信（接続維持用）
   */
  private sendPing(): void {
    if (this.isConnected && this.ws) {
      // 最新のBitget WebSocket仕様ではシンプルな文字列"ping"を送信
      this.ws.send("ping");
      logger.debug('Pingを送信しました');
    }
  }
  
  /**
   * 全ての購読を再開
   */
  private resubscribeAll(): void {
    for (const subscription of this.subscriptions) {
      const [type, symbol, timeframe] = subscription.split(':');
      
      if (type === 'orderbook') {
        this.subscribeOrderBook(symbol);
      } else if (type === 'candlestick' && timeframe) {
        this.subscribeCandles(symbol, timeframe as Timeframe);
      }
    }
  }
  
  /**
   * Ping間隔を設定
   */
  private setupPingInterval(): void {
    this.clearPingInterval();
    // 30秒ごとにPingを送信（ドキュメントの推奨に従う）
    this.pingInterval = setInterval(() => this.sendPing(), 30000);
  }
  
  /**
   * Ping間隔をクリア
   */
  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * 再接続を試みる
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // 指数バックオフを使用して再接続間隔を計算
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      logger.info(`${delay}ms後に再接続を試みます (試行: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.clearReconnectTimeout();
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {
          // 再接続失敗時は何もしない（次の再接続を待つ）
        });
      }, delay);
    } else {
      logger.error('最大再接続試行回数に達しました');
      this.emit('reconnect_failed');
    }
  }
  
  /**
   * 再接続タイムアウトをクリア
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}
