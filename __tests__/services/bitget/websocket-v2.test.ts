/**
 * Bitget WebSocketクライアントのテスト実装（最新仕様対応版）
 * 
 * このファイルは、業界のベストプラクティスに基づいたBitget WebSocketクライアントの
 * テスト実装です。以下の機能をテストします：
 * 
 * 1. WebSocket接続の確立
 * 2. Ping/Pongによる接続維持
 * 3. オーダーブックとローソク足データの購読
 * 4. 再接続メカニズム
 * 5. REST APIとWebSocketの連携（ハイブリッドアプローチ）
 */

import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';

// Bitget APIのエンドポイント（最新版）
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';
const BITGET_REST_ENDPOINT = 'https://api.bitget.com';

// デバッグモード
const DEBUG = true;

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

// ローソク足データの型定義
interface CandleData {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// オーダーブックデータの型定義
interface OrderBookData {
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
class BitgetWebSocketClient extends EventEmitter {
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
        console.log('Bitget WebSocketに接続中...');
        this.ws = new WebSocket(BITGET_WS_ENDPOINT);

        // 接続イベントハンドラ
        this.ws.on('open', () => {
          console.log('Bitget WebSocketに接続しました');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.setupPingInterval();
          this.resubscribeAll();
          resolve();
        });

        // メッセージイベントハンドラ
        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as WebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error('メッセージの解析に失敗しました:', error);
          }
        });

        // エラーイベントハンドラ
        this.ws.on('error', (error) => {
          console.error('WebSocketエラーが発生しました:', error);
          reject(error);
        });

        // 切断イベントハンドラ
        this.ws.on('close', (code, reason) => {
          console.log(`WebSocket接続が切断されました: ${code} ${reason}`);
          this.isConnected = false;
          this.clearPingInterval();
          this.attemptReconnect();
        });
      } catch (error) {
        console.error('WebSocket接続の確立に失敗しました:', error);
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
            instType: "SPOT",
            channel: "books",
            instId: symbol
          }
        ]
      };
      this.send(message);
      console.log(`オーダーブック購読開始: ${symbol}`);
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
            instType: "SPOT",
            channel: channel,
            instId: symbol
          }
        ]
      };
      this.send(message);
      console.log(`ローソク足データ購読開始: ${symbol} ${timeframe}`);
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
      let granularity = timeframe;
      // 1m -> 1min, 1h -> 1hour などの変換が必要な場合はここで行う
      if (timeframe === '1m') granularity = '1min';
      if (timeframe === '3m') granularity = '3min';
      if (timeframe === '5m') granularity = '5min';
      if (timeframe === '15m') granularity = '15min';
      if (timeframe === '30m') granularity = '30min';
      if (timeframe === '1h') granularity = '1hour';
      if (timeframe === '4h') granularity = '4hour';
      if (timeframe === '12h') granularity = '12hour';
      if (timeframe === '1d') granularity = '1day';
      if (timeframe === '1w') granularity = '1week';
      
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
      
      // エラー時はダミーデータを返す（テスト用）
      return this.generateDummyCandles(limit);
    }
  }
  
  /**
   * テスト用のダミーローソク足データを生成
   */
  private generateDummyCandles(count: number): CandleData[] {
    const now = Date.now();
    const result: CandleData[] = [];
    
    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * 60000; // 1分ごと
      const basePrice = 50000 + Math.random() * 5000;
      const open = basePrice.toFixed(2);
      const high = (basePrice * (1 + Math.random() * 0.01)).toFixed(2);
      const low = (basePrice * (1 - Math.random() * 0.01)).toFixed(2);
      const close = (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(2);
      const volume = (Math.random() * 10).toFixed(2);
      
      result.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return result;
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
      console.log(`過去のローソク足データを取得しました: ${historicalData.length}件`);
      
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
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocketが接続されていないため、メッセージを送信できません');
    }
  }

  /**
   * Pingを送信（接続維持用）- 最新仕様
   */
  private sendPing(): void {
    if (this.isConnected) {
      // 最新のBitget WebSocket仕様ではシンプルな文字列"ping"を送信
      this.ws?.send("ping");
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
  private handleMessage(message: WebSocketMessage | string): void {
    // 文字列の場合の処理
    if (typeof message === 'string') {
      if (DEBUG) console.log('WebSocket文字列メッセージ受信:', message);
      
      // Pingレスポンスの処理
      if (message === "pong") {
        if (DEBUG) console.log('Pingレスポンスを受信しました');
      }
      return;
    }
    
    // オブジェクトメッセージの処理
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
      console.log(`${delay}ms後に再接続を試みます (試行: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
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

/**
 * テスト実行関数
 */
async function runTest() {
  try {
    console.log('Bitget WebSocketクライアントのテストを開始します...');
    console.log('デバッグモード:', DEBUG ? 'オン' : 'オフ');
    
    // クライアントのインスタンス化
    const client = new BitgetWebSocketClient();
    
    // イベントリスナーの設定
    client.on('orderbook', (symbol, data) => {
      console.log(`オーダーブックデータを受信 (${symbol}):`);
      console.log(`  Asks: ${data.asks.length}件, Bids: ${data.bids.length}件`);
      
      // 最初の数件のデータを表示
      if (data.asks.length > 0) {
        console.log('  最安値売り注文:', data.asks[0]);
      }
      if (data.bids.length > 0) {
        console.log('  最高値買い注文:', data.bids[0]);
      }
    });
    
    client.on('candle', (symbol, timeframe, data) => {
      console.log(`ローソク足データを受信 (${symbol} ${timeframe}):`);
      console.log(`  時間: ${new Date(data.timestamp).toLocaleString()}`);
      console.log(`  始値: ${data.open}, 高値: ${data.high}, 安値: ${data.low}, 終値: ${data.close}`);
      console.log(`  出来高: ${data.volume}`);
    });
    
    // WebSocket接続
    await client.connect();
    
    // ハイブリッドアプローチでチャートデータを取得
    console.log('ハイブリッドアプローチでチャートデータを取得します...');
    const historicalData = await client.getCompleteChartData('BTCUSDT', '1m', 10);
    
    console.log('過去のローソク足データ:');
    historicalData.forEach((candle, index) => {
      console.log(`${index + 1}. ${new Date(candle.timestamp).toLocaleString()} - O: ${candle.open}, H: ${candle.high}, L: ${candle.low}, C: ${candle.close}, V: ${candle.volume}`);
    });
    
    // オーダーブックも購読
    client.subscribeOrderBook('BTCUSDT');
    
    console.log('テスト実行中...');
    console.log('Ctrl+Cで終了できます');
    
    // クリーンアップ関数
    const cleanup = () => {
      console.log('テストを終了します...');
      client.disconnect();
      process.exit(0);
    };
    
    // 30秒後に自動終了
    setTimeout(() => {
      console.log('30秒経過したため、テストを終了します');
      cleanup();
    }, 30000);
    
    // Ctrl+Cでの終了
    process.on('SIGINT', cleanup);
    
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// テスト実行
runTest();
