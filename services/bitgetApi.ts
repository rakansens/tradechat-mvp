import axios from 'axios';
import CryptoJS from 'crypto-js';
import { OHLCData } from '../types/chart';
import { OrderBookData, OrderBookEntry, BitgetOrderBookResponse } from '../types/market';

// API設定
const BITGET_API_BASE_URL = 'https://api.bitget.com';
const BITGET_WS_URL = 'wss://ws.bitget.com/spot/v1/stream';

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
      const WebSocketServer = require('ws');
      return new WebSocketServer(url);
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
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day',
  '1w': '1week',
};

// タイムフレームマッピング（先物取引用）
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
  private onKlineUpdateCallbacks: ((data: OHLCData) => void)[] = [];
  private exchangeType: ExchangeType = 'spot'; // デフォルトはスポット取引

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
        console.log(`Browser API Request: ${url}`);
        response = await axios.get(url);
      } else {
        // サーバーサイド環境では直接BitgetのAPIを呼び出す
        let endpoint: string;
        let params: Record<string, string>;

        if (this.exchangeType === 'spot') {
          // スポット取引用のエンドポイントとパラメータ
          endpoint = '/api/spot/v1/market/candles';
          const bitgetTimeframe = TIMEFRAME_MAP_SPOT[timeframe] || '1min';
          
          params = {
            symbol: formattedSymbol,
            period: bitgetTimeframe,
            limit: limit.toString(),
            ...(endTime ? { endTime: endTime.toString() } : {}),
          };
        } else {
          // 先物取引用のエンドポイントとパラメータ
          endpoint = '/api/mix/v1/market/candles';
          const bitgetTimeframe = TIMEFRAME_MAP_FUTURES[timeframe] || '1m';
          
          params = {
            symbol: `${formattedSymbol}_UMCBL`, // 先物シンボル形式に変換
            granularity: bitgetTimeframe,
            limit: limit.toString(),
            ...(endTime ? { endTime: endTime.toString() } : {}),
          };
        }

        console.log(`Server API Request (${this.exchangeType}):`, endpoint, params);
        const url = `${BITGET_API_BASE_URL}${endpoint}`;
        response = await axios.get(url, { params });
      }

      console.log('API response:', response.data);

      // エラーハンドリングを強化
      if (!response.data) {
        console.error('Empty API response');
        throw new Error('Empty API response');
      }

      // レスポンスデータの処理
      if (response.data.code === '00000' && Array.isArray(response.data.data)) {
        return response.data.data.map((candle: any) => ({
          time: parseInt(candle[0]), // タイムスタンプ (ミリ秒)
          open: parseFloat(candle[1]),
          high: parseFloat(candle[2]),
          low: parseFloat(candle[3]),
          close: parseFloat(candle[4]),
          volume: parseFloat(candle[5]),
        }));
      }

      const errorMsg = response.data.msg || 'Unknown error';
      console.error(`API error: ${errorMsg}`, response.data);
      throw new Error(`API error: ${errorMsg}`);
    } catch (error) {
      console.error('Error fetching historical candles:', error);
      // エラーを伝播
      throw error;
    }
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

        const url = `/api/bitget/orderbook?${params.toString()}`;
        console.log(`Browser API Request (OrderBook): ${url}`);
        response = await axios.get(url);
      } else {
        // サーバーサイド環境では直接BitgetのAPIを呼び出す
        let endpoint: string;
        let params: Record<string, string>;

        if (exchangeType === 'spot') {
          // スポット取引用のエンドポイント
          endpoint = '/api/spot/v1/market/orderbook';
          params = {
            symbol: formattedSymbol,
            limit: '150', // デフォルトの深さ
          };
        } else {
          // 先物取引用のエンドポイント
          endpoint = '/api/mix/v1/market/orderbook';
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
        throw new Error('Empty API response');
      }

      // エラー応答の処理
      if (response.data.code !== '00000') {
        throw new Error(`Bitget API Error: ${response.data.msg || 'Unknown error'}`);
      }

      // レスポンスデータの変換
      const data = response.data as BitgetOrderBookResponse;
      
      // OrderBookDataに変換
      return {
        symbol: symbol,
        timestamp: parseInt(data.data.timestamp),
        asks: data.data.asks.map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          amount: parseFloat(ask[1])
        })),
        bids: data.data.bids.map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          amount: parseFloat(bid[1])
        }))
      };
    } catch (error: any) {
      console.error('Error fetching order book:', error);
      throw new Error(`Failed to fetch order book: ${error.message}`);
    }
  }

  // WebSocketコネクションの開始
  connectWebSocket() {
    if (this.ws) {
      this.ws.close();
    }

    try {
      // WebSocket作成関数を使用
      this.ws = createWebSocket(BITGET_WS_URL);

      // Null安全性のためのチェック
      if (!this.ws) {
        throw new Error('WebSocket creation failed');
      }

      this.ws.onopen = () => {
        console.log('BitgetWS: Connection established');
        this.sendPing();
        this.pingInterval = setInterval(() => this.sendPing(), 20000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('BitgetWS: Error:', error);
        this.reconnect();
      };

      this.ws.onclose = () => {
        console.log('BitgetWS: Connection closed');
        this.cleanup();
        this.reconnect();
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.reconnect();
    }
  }

  // ローソク足データの購読
  subscribeToKline(symbol: string, timeframe: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connectWebSocket();
    }

    // シンボルとタイムフレームを適切な形式に変換
    const formattedSymbol = symbol.replace('/', '').toUpperCase();
    const bitgetTimeframe = this.exchangeType === 'spot' 
      ? TIMEFRAME_MAP_SPOT[timeframe] || '1min'
      : TIMEFRAME_MAP_FUTURES[timeframe] || '1m';
    
    // WebSocketのサブスクリプションメッセージを構築
    let subscriptionMessage;
    
    if (this.exchangeType === 'spot') {
      subscriptionMessage = {
        op: 'subscribe',
        args: [
          {
            instType: 'sp',
            channel: 'candle' + bitgetTimeframe,
            instId: formattedSymbol,
          },
        ],
      };
    } else {
      subscriptionMessage = {
        op: 'subscribe',
        args: [
          {
            instType: 'mc',
            channel: 'candle' + bitgetTimeframe,
            instId: `${formattedSymbol}_UMCBL`,
          },
        ],
      };
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(subscriptionMessage));
      console.log(`Subscribed to ${this.exchangeType} ${formattedSymbol} ${timeframe} candles`);
    } else {
      // WebSocketが接続していない場合は、接続後にサブスクライブする
      const previousOnOpen = this.ws?.onopen;
      if (this.ws) {
        this.ws.onopen = (event) => {
          // TypeScriptのNull安全性エラーを修正
          if (previousOnOpen && this.ws) {
            previousOnOpen.call(this.ws, event);
          }
          if (this.ws) {
            this.ws.send(JSON.stringify(subscriptionMessage));
            console.log(`Subscribed to ${this.exchangeType} ${formattedSymbol} ${timeframe} candles`);
          }
        };
      }
    }
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
    // pingメッセージに対するpongレスポンス
    if (message.event === 'ping') {
      this.sendPong(message.ts);
      return;
    }

    // ローソク足データの処理
    if (message.data && message.arg && message.arg.channel && message.arg.channel.startsWith('candle')) {
      const klineData = this.parseKlineData(message);
      if (klineData) {
        this.onKlineUpdateCallbacks.forEach(callback => callback(klineData));
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

  // WebSocketにpingメッセージを送信
  private sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const pingMessage = {
        op: 'ping',
        ts: Date.now(),
      };
      this.ws.send(JSON.stringify(pingMessage));
    }
  }

  // pingメッセージに対するpongレスポンス
  private sendPong(ts: string | number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const pongMessage = {
        op: 'pong',
        ts,
      };
      this.ws.send(JSON.stringify(pongMessage));
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