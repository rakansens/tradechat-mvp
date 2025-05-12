/**
 * Bitget WebSocketクライアント（最新仕様対応版）
 * 
 * このファイルは、業界のベストプラクティスに基づいたBitget WebSocketクライアントの
 * 実装です。以下の機能を提供します：
 * 
 * 1. WebSocket接続の確立と維持
 * 2. Ping/Pongによる接続維持
 * 3. オーダーブックとローソク足データの購読
 * 4. 再接続メカニズム
 * 5. REST APIとWebSocketの連携（ハイブリッドアプローチ）
 */

import axios from 'axios';
import { EventEmitter } from 'events';

// 環境検出
const isNodeJS = typeof window === 'undefined';

// Node.js環境でのみwsをインポート
let WebSocketImpl: any = null;
if (isNodeJS) {
  try {
    WebSocketImpl = require('ws');
  } catch (e) {
    console.error('Failed to import ws in Node.js environment', e);
  }
} else {
  // ブラウザ環境ではネイティブのWebSocketを使用
  WebSocketImpl = WebSocket;
}

// Bitget APIのエンドポイント（最新版）
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';
const BITGET_REST_ENDPOINT = 'https://api.bitget.com';

// デバッグモード
const DEBUG = false;

// タイムフレームのマッピング（最新仕様）
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

// REST APIのタイムフレームマッピング
const REST_TIMEFRAME_MAP: { [key: string]: string } = {
  '1m': '1min',
  '3m': '3min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1hour',
  '4h': '4hour',
  '12h': '12hour',
  '1d': '1day',
  '1w': '1week'
};

// ローソク足データの型定義
export interface CandleData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// オーダーブックデータの型定義
export interface OrderBookData {
  asks: [string, string][];  // [価格, 数量]
  bids: [string, string][];  // [価格, 数量]
  timestamp: number;
}

// WebSocketメッセージの型定義
interface WebSocketMessage {
  event?: string;
  arg?: {
    instType?: string;
    channel?: string;
    instId?: string;
  };
  data?: any;
  code?: string;
  msg?: string;
  action?: string;
  op?: string;
  args?: any[];
}

/**
 * Bitget WebSocketクライアント
 */
export class BitgetWebSocketClient extends EventEmitter {
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
    this.setupEventHandlers();
  }

  /**
   * WebSocket接続を確立
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (DEBUG) console.log('Bitget WebSocketに接続中...');
        
        // 環境に応じたWebSocketの作成
        if (isNodeJS && WebSocketImpl) {
          this.ws = new WebSocketImpl(BITGET_WS_ENDPOINT);
          
          // Node.js環境でのイベントハンドラ設定
          this.ws.on('open', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.setupPingInterval();
            this.resubscribeAll();
            resolve();
          });
          
          this.ws.on('message', (data: any) => {
            try {
              const message = JSON.parse(typeof data === 'string' ? data : data.toString());
              this.handleMessage(message);
            } catch (error) {
              this.emit('error', `メッセージの解析に失敗: ${error}`);
            }
          });
          
          this.ws.on('error', (error: any) => {
            this.emit('error', `WebSocketエラー: ${error}`);
            reject(error);
          });
          
          this.ws.on('close', (code: number, reason: string) => {
            this.isConnected = false;
            this.clearPingInterval();
            this.emit('disconnected', code, reason);
            this.attemptReconnect();
          });
        } else {
          // ブラウザ環境でのWebSocket作成
          this.ws = new WebSocket(BITGET_WS_ENDPOINT);
          
          // ブラウザ環境でのイベントハンドラ設定
          this.ws.onopen = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.setupPingInterval();
            this.resubscribeAll();
            resolve();
          };
          
          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              this.emit('error', `メッセージの解析に失敗: ${error}`);
            }
          };
          
          this.ws.onerror = (error) => {
            this.emit('error', `WebSocketエラー: ${error}`);
            reject(error);
          };
          
          this.ws.onclose = (event) => {
            this.isConnected = false;
            this.clearPingInterval();
            this.emit('disconnected', event.code, event.reason);
            this.attemptReconnect();
          };
        }
      } catch (error) {
        this.emit('error', `接続エラー: ${error}`);
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
    }
  }

  /**
   * オーダーブックデータを購読（最新仕様）
   */
  public subscribeOrderBook(symbol: string): void {
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
      if (DEBUG) console.log(`オーダーブック購読開始: ${symbol}`);
    }
  }

  /**
   * ローソク足データを購読（最新仕様）
   */
  public subscribeCandles(symbol: string, timeframe: string): void {
    const channel = TIMEFRAME_MAP[timeframe];
    if (!channel) {
      console.error(`未対応のタイムフレーム: ${timeframe}`);
      return;
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
      if (DEBUG) console.log(`ローソク足データ購読開始: ${symbol} ${timeframe}`);
    }
  }

  /**
   * 過去のローソク足データを取得（REST API）
   */
  public async fetchHistoricalCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<CandleData[]> {
    try {
      // Bitget REST APIの正しいエンドポイント
      const endpoint = `${BITGET_REST_ENDPOINT}/api/v2/spot/market/candles`;
      
      // タイムフレームをBitgetの正しいフォーマットに変換
      const granularity = REST_TIMEFRAME_MAP[timeframe] || timeframe;
      
      // パラメータの準備
      const params = {
        symbol: symbol,
        granularity: granularity,
        limit: limit.toString()
      };
      
      if (DEBUG) console.log(`REST APIリクエスト: ${endpoint}`, params);
      
      // APIリクエスト
      const response = await axios.get(endpoint, { params });
      
      if (DEBUG) console.log('REST APIレスポンス:', response.status);
      
      if (response.data && response.data.data) {
        if (DEBUG) console.log(`取得したデータ: ${response.data.data.length}件`);
        
        // レスポンスデータを変換
        return response.data.data.map((item: any[]) => ({
          timestamp: parseInt(item[0]),
          open: item[1],
          high: item[2],
          low: item[3],
          close: item[4],
          volume: item[5]
        }));
      }
      
      return [];
    } catch (error) {
      console.error('過去のローソク足データの取得に失敗しました:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('APIエラーレスポンス:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * ハイブリッドアプローチでチャートデータを取得
   * 1. REST APIで過去データを取得
   * 2. WebSocketで最新データをリアルタイム更新
   */
  public async getCompleteChartData(
    symbol: string,
    timeframe: string,
    limit: number = 100
  ): Promise<CandleData[]> {
    try {
      // 1. REST APIで過去データを取得
      const historicalData = await this.fetchHistoricalCandles(symbol, timeframe, limit);
      if (DEBUG) console.log(`過去のローソク足データを取得しました: ${historicalData.length}件`);
      
      // 2. WebSocketで最新データを購読
      this.subscribeCandles(symbol, timeframe);
      
      return historicalData;
    } catch (error) {
      console.error('チャートデータの取得に失敗しました:', error);
      throw error;
    }
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
        this.emit('error', `メッセージ送信エラー: ${error}`);
      }
    } else {
      this.emit('error', '接続が確立されていないため、メッセージを送信できません');
    }
  }

  /**
   * Pingを送信（接続維持用）- 最新仕様
   */
  private sendPing(): void {
    if (this.isConnected && this.ws) {
      // 最新のBitget WebSocket仕様ではシンプルな文字列"ping"を送信
      this.ws.send("ping");
      if (DEBUG) console.log('Pingを送信しました');
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
      } else if (type === 'candles' && timeframe) {
        this.subscribeCandles(symbol, timeframe);
      }
    }
  }

  /**
   * 受信メッセージを処理
   */
  private handleMessage(message: WebSocketMessage): void {
    if (DEBUG) console.log('WebSocketメッセージ受信:', JSON.stringify(message).substring(0, 200) + '...');
    
    // エラーメッセージの処理
    if (message.event === 'error' || (message.code && message.code !== '0')) {
      console.error('エラーメッセージを受信しました:', message);
      return;
    }
    
    // データメッセージの処理
    if (message.arg && message.data) {
      const { instId, channel } = message.arg;
      
      // オーダーブックデータの処理
      if (channel === 'books') {
        const orderBookData: OrderBookData = {
          asks: message.data.asks || [],
          bids: message.data.bids || [],
          timestamp: Date.now()
        };
        
        if (DEBUG) console.log(`オーダーブックデータ受信: ${instId}, asks: ${orderBookData.asks.length}, bids: ${orderBookData.bids.length}`);
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
          const candleData: CandleData = {
            timestamp: parseInt(candle[0]),
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5]
          };
          
          if (DEBUG) console.log(`ローソク足データ受信: ${instId} ${timeframe}, 時間: ${new Date(candleData.timestamp).toLocaleString()}`);
          this.emit('candle', instId, timeframe, candleData);
        }
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
      if (DEBUG) console.log(`${delay}ms後に再接続を試みます (試行: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      this.clearReconnectTimeout();
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {
          // 再接続失敗時は何もしない（次の再接続を待つ）
        });
      }, delay);
    } else {
      console.error('最大再接続試行回数に達しました');
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

  /**
   * イベントハンドラを設定
   */
  private setupEventHandlers(): void {
    // 必要に応じてイベントハンドラを追加
  }
}
