import axios from 'axios';
import { OHLCData } from '../types/chart';
import { OrderBookData, OrderBookEntry, BitgetOrderBookResponse } from '../types/market';

// API設定
const BITGET_API_BASE_URL = 'https://api.bitget.com';
// V2 WebSocketエンドポイント（Public）に更新
const BITGET_WS_URL = 'wss://ws.bitget.com/v2/ws/public';

// デモモード設定
const ENABLE_DEMO_MODE_ON_ERROR = true; // エラー時のデモモード有効

// 環境判定
const isBrowser = typeof window !== 'undefined';

// 環境に応じたWebSocketの作成
const createWebSocket = (url: string) => {
  if (isBrowser) {
    // ブラウザ環境ではnativeのWebSocketを使用
    return new WebSocket(url);
  } else {
    // Node.js環境ではwsライブラリを使用（サーバーサイドのみ）
    try {
      const WebSocketImpl = require('ws');
      return new WebSocketImpl(url);
    } catch (e) {
      console.error('Failed to create WebSocket in Node.js environment:', e);
      return null;
    }
  }
};

export interface BitgetCredentials {
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
}

// タイムフレームマッピング（スポット取引用）
export const TIMEFRAME_MAP_SPOT: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
  '1w': '1W',
};

// タイムフレームマッピング（先物取引用・WebSocket/REST 共通）
export const TIMEFRAME_MAP_FUTURES: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
  '4h': '4H',
  '1d': '1D',
  '1w': '1W',
};

// 取引所タイプ
export type ExchangeType = 'spot' | 'futures';

export class BitgetApiClient {
  private credentials: BitgetCredentials;
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  private lastSymbol: string | null = null;
  private lastTimeframe: string | null = null;
  private onKlineUpdateCallbacks: ((data: OHLCData) => void)[] = [];
  private exchangeType: ExchangeType = 'spot'; // デフォルトはスポット取引
  private isInDemoMode: boolean = false; // デモモードフラグ

  constructor(credentials: BitgetCredentials = {}, exchangeType: ExchangeType = 'spot') {
    this.credentials = credentials;
    this.exchangeType = exchangeType;
  }

  // REST APIを使用して過去のローソク足データを取得
  async getHistoricalCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
    endTime?: number
  ): Promise<OHLCData[]> {
    try {
      // シンボルを正しい形式に変換（スラッシュを削除）
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      let response;

      if (isBrowser) {
        // ブラウザ環境ではNext.jsのAPIルートを使用
        const params = new URLSearchParams({
          type: this.exchangeType,
          symbol: formattedSymbol,
          timeframe,
          limit: limit.toString(),
          ...(endTime ? { endTime: endTime.toString() } : {})
        });

        const url = `/api/bitget/candles?${params.toString()}`;
        console.log(`Browser API Request (Candles): ${url}`);
        response = await axios.get(url);
      } else {
        // サーバーサイド環境では直接BitgetのAPIを呼び出す
        let endpoint: string;
        let params: Record<string, string>;

        // V2 APIを使用
        if (this.exchangeType === 'spot') {
          // スポット取引用のV2エンドポイント
          endpoint = '/api/v2/spot/market/candles';
          
          // タイムフレームをBitget V2 API形式に変換
          const granularity = this.convertTimeframeToBitgetV2Format(timeframe);
          
          params = {
            symbol: formattedSymbol,
            granularity,
            limit: limit.toString(),
            ...(endTime ? { endTime: endTime.toString() } : {}),
          };
        } else {
          // 先物取引用のV2エンドポイント
          endpoint = '/api/v2/mix/market/candles';
          
          // タイムフレームをBitget V2 API形式に変換
          const granularity = this.convertTimeframeToBitgetV2Format(timeframe);
          
          params = {
            symbol: `${formattedSymbol}_UMCBL`, // 先物シンボル形式に変換
            granularity,
            limit: limit.toString(),
            ...(endTime ? { endTime: endTime.toString() } : {}),
          };
        }

        console.log(`Server API Request (${this.exchangeType} Candles):`, endpoint, params);
        const url = `${BITGET_API_BASE_URL}${endpoint}`;
        response = await axios.get(url, { params });
      }

      console.log('API response:', response.data);

      // エラーハンドリングを強化
      if (!response.data) {
        console.error('Empty API response');
        if (ENABLE_DEMO_MODE_ON_ERROR) {
          return this.generateDemoCandles(limit);
        }
        throw new Error('Empty API response');
      }

      // V2 APIのレスポンス形式に合わせて処理
      if (response.data.data && Array.isArray(response.data.data)) {
        // Bitget V2 APIレスポンスからOHLCデータを変換
        return response.data.data.map((candle: any) => ({
          time: parseInt(candle[0]), // タイムスタンプ (ミリ秒)
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
        }));
      }

      // エラーの場合、デモデータを返す
      if (ENABLE_DEMO_MODE_ON_ERROR) {
        console.log('Falling back to demo candle data');
        return this.generateDemoCandles(limit);
      }

      const errorMsg = response.data.msg || 'Unknown error';
      console.error(`API error: ${errorMsg}`, response.data);
      throw new Error(`API error: ${errorMsg}`);
    } catch (error) {
      console.error('Error fetching historical candles:', error);
      
      // エラー時にデモデータを返す
      if (ENABLE_DEMO_MODE_ON_ERROR) {
        console.log('Falling back to demo candle data due to error');
        return this.generateDemoCandles(limit);
      }
      
      // エラーを伝播
      throw error;
    }
  }

  // デモ用のキャンドルデータを生成
  private generateDemoCandles(count: number): OHLCData[] {
    this.isInDemoMode = true;
    console.log('Generating demo candle data');
    const now = Date.now();
    const candles: OHLCData[] = [];
    
    // BTCの場合はそれらしい価格を使用
    const basePrice = 65000; // 基本価格
    const volatility = 1000; // 価格変動幅
    
    for (let i = 0; i < count; i++) {
      const time = now - i * 86400000; // 1日ごと
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility * 0.5;
      const high = Math.max(open, close) + Math.random() * volatility * 0.2;
      const low = Math.min(open, close) - Math.random() * volatility * 0.2;
      const volume = 100 + Math.random() * 200;
      
      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    // 時間の降順でソート
    return candles.sort((a, b) => b.time - a.time);
  }

  // タイムフレームをBitget V2 API形式に変換
  private convertTimeframeToBitgetV2Format(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',      // 1分足
      '5m': '5min',      // 5分足
      '15m': '15min',    // 15分足
      '30m': '30min',    // 30分足
      '1h': '1h',        // 1時間足
      '4h': '4h',        // 4時間足
      '6h': '6h',        // 6時間足
      '12h': '12h',      // 12時間足
      '1d': '1day',      // 日足
      '1w': '1week',     // 週足
      '1M': '1M',        // 月足
    };
    
    return mapping[timeframe] || '1day'; // デフォルトは日足
  }

  // オーダーブック取得関数を追加
  async getOrderBook(
    symbol: string,
    exchangeType: ExchangeType = this.exchangeType
  ): Promise<OrderBookData> {
    try {
      // シンボルを正しい形式に変換（スラッシュを削除）
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      let response;

      if (isBrowser) {
        // ブラウザ環境ではNext.jsのAPIルートを使用
        const params = new URLSearchParams({
          symbol: formattedSymbol,
          type: exchangeType,
        });

        // URLのパスを修正（最後にスラッシュを追加）
        const url = `/api/bitget/orderbook?${params.toString()}`;
        console.log(`Browser API Request (OrderBook): ${url}`);
        response = await axios.get(url);
      } else {
        // サーバーサイド環境では直接BitgetのAPIを呼び出す
        let endpoint: string;
        let params: Record<string, string>;

        // 最新のBitgetAPI V2を使用
        if (exchangeType === 'spot') {
          // スポット取引用の最新エンドポイント (V2 API)
          endpoint = '/api/v2/spot/market/orderbook';
          params = {
            symbol: formattedSymbol,
            limit: '150', // デフォルトの深さ
          };
        } else {
          // 先物取引用の最新エンドポイント (V2 API)
          endpoint = '/api/v2/mix/market/orderbook';
          params = {
            symbol: `${formattedSymbol}_UMCBL`, // 先物シンボル形式
            limit: '150',
          };
        }

        console.log(`Server API Request (OrderBook):`, endpoint, params);
        const url = `${BITGET_API_BASE_URL}${endpoint}`;
        response = await axios.get(url, { params });
      }

      // レスポンスのバリデーション
      if (!response.data) {
        if (ENABLE_DEMO_MODE_ON_ERROR) {
          return this.generateDemoOrderBook(symbol);
        }
        throw new Error('Empty API response');
      }

      // V2 APIのレスポンス形式に合わせて処理
      // エラー応答の処理
      if (response.data.code && response.data.code !== '00000') {
        console.error(`Bitget API Error: ${response.data.msg || 'Unknown error'}`);
        if (ENABLE_DEMO_MODE_ON_ERROR) {
          return this.generateDemoOrderBook(symbol);
        }
        throw new Error(`Bitget API Error: ${response.data.msg || 'Unknown error'}`);
      }

      // レスポンスデータの変換
      const responseData = response.data.data || response.data;
      
      // OrderBookDataに変換
      return {
        symbol: symbol,
        timestamp: parseInt(responseData.timestamp || Date.now().toString()),
        asks: (responseData.asks || []).map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          amount: parseFloat(ask[1])
        })),
        bids: (responseData.bids || []).map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          amount: parseFloat(bid[1])
        }))
      };
    } catch (error: any) {
      console.error('Error fetching order book:', error);
      
      // エラー時にデモデータを返す
      if (ENABLE_DEMO_MODE_ON_ERROR) {
        return this.generateDemoOrderBook(symbol);
      }
      
      throw new Error(`Failed to fetch order book: ${error.message}`);
    }
  }

  // デモ用のオーダーブックデータを生成
  private generateDemoOrderBook(symbol: string): OrderBookData {
    this.isInDemoMode = true;
    console.log('Generating demo order book data');
    
    // BTCの場合はそれらしい価格を使用
    const basePrice = 65000; // 基本価格
    const asks: OrderBookEntry[] = [];
    const bids: OrderBookEntry[] = [];
    
    // ASK（売り注文）を生成
    for (let i = 0; i < 20; i++) {
      const price = basePrice + i * 5 + Math.random() * 2;
      const amount = 0.1 + Math.random() * 2;
      asks.push({ price, amount });
    }
    
    // BID（買い注文）を生成
    for (let i = 0; i < 20; i++) {
      const price = basePrice - i * 5 - Math.random() * 2;
      const amount = 0.1 + Math.random() * 2;
      bids.push({ price, amount });
    }
    
    return {
      symbol,
      timestamp: Date.now(),
      asks,
      bids
    };
  }

  // WebSocketコネクションの開始
  connectWebSocket(symbol: string = 'BTC/USDT', timeframe: string = '1m', exchangeType: ExchangeType = this.exchangeType) {
    this.lastSymbol = symbol;
    this.lastTimeframe = timeframe;
    // 既存のWebSocketをクリーンアップ
    this.cleanup();
    
    // 取引種別を更新
    // *WebSocket subscribe では sp / mc (lowercase) を要求*
    this.exchangeType = exchangeType;
    
    // デモモードを無効化
    this.isInDemoMode = false;

    try {
      // WebSocket作成関数を使用
      this.ws = createWebSocket(BITGET_WS_URL);

      // Null安全性のためのチェック
      if (!this.ws) {
        console.error('BitgetWS: WebSocket creation failed, switching to demo mode');
        this.isInDemoMode = true;
        return;
      }

      this.ws.onopen = () => {
        console.log('BitgetWS: Connection established');
        this.sendPing();
        this.pingInterval = setInterval(() => this.sendPing(), 20000);
        this.isInDemoMode = false; // 接続成功したらデモモードをオフ
        // 自動再購読
        if (this.lastSymbol && this.lastTimeframe) {
          this.subscribeToKline(this.lastSymbol, this.lastTimeframe);
        }
      };

      this.ws.onmessage = (event) => {
        // Heartbeat response is plain text 'pong'
        if (event.data === 'pong') {
          console.log('BitgetWS: pong received');
          return;
        }
        try {
          const message = JSON.parse(event.data as string);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('BitgetWS: Error:', error);
        
        // エラーオブジェクトの詳細をログに出力
        try {
          console.error('BitgetWS: Error details:', JSON.stringify(error));
        } catch (e) {
          console.error('BitgetWS: Error details could not be stringified');
        }
        
        // 再接続を試みる
        this.reconnect();
      };

      this.ws.onclose = () => {
        console.log('BitgetWS: Connection closed');
        this.cleanup();
        this.reconnect();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isInDemoMode = true; // エラー発生時はデモモードに
      this.reconnect();
    }
  }

  // ローソク足データの購読
  subscribeToKline(symbol: string, timeframe: string) {
    this.lastSymbol = symbol;
    this.lastTimeframe = timeframe;
    // WebSocketが接続されていない場合は接続する
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket(symbol, timeframe, this.exchangeType);
    }

    // シンボルとタイムフレームを適切な形式に変換
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const bitgetTimeframe = this.exchangeType === 'spot' 
      ? TIMEFRAME_MAP_SPOT[timeframe] || '1m'
      : TIMEFRAME_MAP_FUTURES[timeframe] || '1m';

    // --- instType / instId (v2 spec) ---
    // instType must be UPPERCASE ('SP' for spot, 'MC' for futures)
    // futures instId requires the contract suffix `_UMCBL`
    const instType = this.exchangeType === 'spot' ? 'SPOT' : 'USDT-FUTURES';
    const instId   = this.exchangeType === 'spot'
      ? formattedSymbol
      : `${formattedSymbol}_UMCBL`;

    // V2 WebSocket API形式のサブスクリプションメッセージ
    const subscriptionMessage = {
      op: 'subscribe',
      args: [
        {
          instType: instType,
          channel: `candle${bitgetTimeframe}`,
          instId: instId
        }
      ]
    };

    console.log('BitgetWS: Sending subscription message:', JSON.stringify(subscriptionMessage));

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.safeSend(subscriptionMessage);
      console.log(`Subscribed to ${this.exchangeType} ${formattedSymbol} ${timeframe} candles`);
    } // 接続中(OPENでない)の場合は onopen で再購読される
  }

  // 取引種別を切り替える
  setExchangeType(type: ExchangeType) {
    this.exchangeType = type;
  }

  // ローソク足の更新リスナーを追加
  onKlineUpdate(callback: (data: OHLCData) => void) {
    this.onKlineUpdateCallbacks.push(callback);
  }

  // WebSocketメッセージのハンドリング
  private handleWebSocketMessage(message: any) {
    // V2 APIのpingメッセージやpongレスポンスの処理
    if (typeof message === 'string') {
      if (message === 'pong') {
        console.log('BitgetWS: pong handled');
        return;
      }
    }
    
    // 接続成功メッセージの処理
    if (message.event === 'subscribe' && message.code === '0') {
      console.log(`BitgetWS: Successfully subscribed to ${message.arg?.channel || 'unknown channel'}`);
      return;
    }

    // エラーメッセージの処理
    if (message.code && message.code !== '0') {
      console.error(`BitgetWS: Error code ${message.code}, message: ${message.msg}`);
      return;
    }

    // V2 APIのローソク足データの処理
    if (message.data && message.arg && message.arg.channel && message.arg.channel.startsWith('candle')) {
      try {
        const klineData = this.parseKlineData(message);
        if (klineData) {
          this.onKlineUpdateCallbacks.forEach(callback => callback(klineData));
        }
      } catch (error) {
        console.error('BitgetWS: Error parsing kline data:', error);
      }
    }
  }

  // ローソク足データのパース
  private parseKlineData(message: any): OHLCData | null {
    try {
      const candle = message.data[0];
      
      // OHLCData型に合わせてパース
      const result: OHLCData = {
        time: parseInt(candle[0]), // タイムスタンプをnumber型として扱う
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5]),
      };
      
      return result;
    } catch (error) {
      console.error('Error parsing kline data:', error);
      return null;
    }
  }

  // WebSocketにpingメッセージを送信 (V2 API形式)
  private sendPing() {
    try {
      this.safeSend('ping');
      console.log('BitgetWS: Ping sent');
    } catch (error) {
      console.error('BitgetWS: Error sending ping:', error);
      this.reconnect();
    }
  }

  // メッセージを安全に送信するヘルパーメソッド
  private safeSend(msg: object | string) {
    if (!this.ws) return;
    
    const sendData = typeof msg === 'string' ? msg : JSON.stringify(msg);
    const sendAction = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(sendData);
      }
    };

    if (this.ws.readyState === WebSocket.OPEN) {
      sendAction();
    } else {
      // 一度だけ実行されるリスナーを追加（既存のonopen上書きなし）
      this.ws.addEventListener('open', sendAction, { once: true });
    }
  }

  // WebSocketの再接続
  private reconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setTimeout(() => {
        console.log('BitgetWS: Attempting to reconnect...');
        this.connectWebSocket();
        this.reconnectInterval = null;
      }, 5000);
    }
  }

  // リソースのクリーンアップ
  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // WebSocketの切断
  disconnectWebSocket() {
    this.cleanup();
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 