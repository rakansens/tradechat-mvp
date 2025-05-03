// services/bitgetApi.ts
// 更新: エラーハンドリングの強化と型安全性の向上

// services/bitgetApi.ts
// 更新: 共通API関数を使用するように変更

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { OHLCData } from '../types/chart';
import { OrderBookData, OrderBookEntry, BitgetOrderBookResponse } from '../types/market';
import { handleApiError, handleWebSocketError } from './errorHandler';
import { 
  apiRequest, 
  adaptiveApiRequest, 
  createCancellableRequest,
  API_CONFIG,
  IS_DEV,
  IS_BROWSER 
} from './api';
import { ExchangeType } from '../types/api';

// API設定は共通モジュールから取得
const BITGET_API_BASE_URL = API_CONFIG.bitget.baseUrl;
const BITGET_WS_URL = API_CONFIG.bitget.wsUrl;
const ENABLE_DEMO_MODE_ON_ERROR = API_CONFIG.bitget.enableDemoMode;

// 環境に応じたWebSocketの作成
const createWebSocket = (url: string) => {
  if (IS_BROWSER) {
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
  '6h': '6H',
  '12h': '12H',
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
  '6h': '6H',
  '12h': '12H',
  '1d': '1D',
  '1w': '1W',
};

// 取引所タイプは types/api.ts に移動しました

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
  private currentSubscription: { instType: string; channel: string; instId: string } | null = null;

  constructor(credentials: BitgetCredentials = {}, exchangeType: ExchangeType = 'spot') {
    this.credentials = credentials;
    this.exchangeType = exchangeType;
  }

  // REST APIを使用して過去のローソク足データを取得
  /**
   * 過去のキャンドルデータを取得する
   * @param symbol 通貨ペア (例: 'BTC/USDT')
   * @param timeframe タイムフレーム (例: '1m', '5m', '1h', '1d')
   * @param limit 取得するキャンドル数
   * @param endTime 取得終了時間 (Unixタイムスタンプミリ秒)
   * @returns キャンドルデータの配列
   */
  async getHistoricalCandles(symbol: string, timeframe: string, limit: number = 100, endTime?: number) {
    try {
      // シンボルを正しい形式に変換（スラッシュを削除）
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      
      // パラメータの準備
      const browserParams = {
        symbol: formattedSymbol,
        timeframe,
        limit: limit.toString(),
        ...(endTime ? { endTime: endTime.toString() } : {})
      };
      
      // サーバー側用のパラメータ
      const serverParams = {
        ...(this.exchangeType === 'spot'
          ? { symbol: formattedSymbol }
          : { symbol: `${formattedSymbol}_UMCBL` }), // 先物シンボル形式
        granularity: this.convertTimeframeToBitgetV2Format(timeframe),
        limit: limit.toString(),
        ...(endTime ? { endTime: endTime.toString() } : {})
      };
      
      // エンドポイントの準備
      const serverEndpoint = this.exchangeType === 'spot'
        ? '/api/v2/spot/market/candles'
        : '/api/v2/mix/market/candles';
      
      // キャンセル可能なリクエストを作成
      const { signal } = createCancellableRequest();
      
      // 共通API関数を使用してデータを取得
      const response = await adaptiveApiRequest({
        browserEndpoint: '/api/bitget/candles',
        serverBaseUrl: BITGET_API_BASE_URL,
        serverEndpoint,
        params: IS_BROWSER ? browserParams : serverParams,
        options: {
          method: 'GET',
          errorTitle: 'チャートデータ取得エラー',
          errorDescription: `${symbol} ${timeframe} のチャートデータ取得に失敗しました`,
          showToast: IS_DEV,
          signal,
          fallbackData: null
        }
      });
      
      // レスポンスの構造を査定して適切に処理
      if (IS_DEV) console.log('API Response:', response);
      
      // レスポンスデータの変換
      let responseData;
      
      // 様々なレスポンス構造に対応
      if (response?.data?.data) {
        // { data: { data: [...] } } 形式
        responseData = response.data.data;
      } else if (response?.data) {
        // { data: [...] } 形式
        responseData = response.data;
      } else {
        // 直接データが返される場合
        responseData = response;
      }
      
      if (!responseData) {
        if (IS_DEV) console.error('Empty API response');
        throw new Error('Empty API response');
      }
      
      // 配列でない場合は配列に変換を試みる
      if (!Array.isArray(responseData)) {
        if (IS_DEV) console.log('Response is not an array, trying to extract array data');
        // 各種プロパティから配列を探す
        if (Array.isArray(responseData.candles)) {
          responseData = responseData.candles;
        } else if (Array.isArray(responseData.items)) {
          responseData = responseData.items;
        } else if (Array.isArray(responseData.list)) {
          responseData = responseData.list;
        } else {
          if (IS_DEV) console.error('Could not find array data in response', responseData);
          throw new Error('Invalid candle data format');
        }
      }

      if (IS_DEV) console.log('Candle data before processing:', responseData);
      
      // キャンドルデータを正規化して返す
      const processedData = responseData
        .map((candle: any) => {
          try {
            let result;
            // Bitget V2 APIのレスポンス形式に合わせて処理
            // [タイムスタンプ, 始値, 高値, 安値, 終値, 出来高, 出来安]
            if (Array.isArray(candle)) {
              // 必要なデータが存在するか確認
              if (!candle[0] || !candle[1] || !candle[2] || !candle[3] || !candle[4]) {
                if (IS_DEV) console.warn('Skipping invalid candle array data:', candle);
                return null;
              }
              
              const timestamp = parseInt(String(candle[0]));
              if (isNaN(timestamp) || timestamp <= 0) {
                if (IS_DEV) console.warn('Invalid timestamp in candle array data:', candle[0]);
                return null;
              }
              
              result = {
                time: timestamp, // lightweight-chartsの要件に合わせてtimeとして設定
                open: parseFloat(String(candle[1])),
                high: parseFloat(String(candle[2])),
                low: parseFloat(String(candle[3])),
                close: parseFloat(String(candle[4])),
                volume: parseFloat(String(candle[5] || candle[6] || '0'))
              };
            } else {
              // オブジェクト形式の場合
              // 必要なデータが存在するか確認
              if (!candle.open || !candle.high || !candle.low || !candle.close) {
                if (IS_DEV) console.warn('Skipping invalid candle object data:', candle);
                return null;
              }
              
              const timestamp = parseInt(String(candle.timestamp || candle.ts || candle.time || Date.now()));
              if (isNaN(timestamp) || timestamp <= 0) {
                if (IS_DEV) console.warn('Invalid timestamp in candle object data:', candle.timestamp || candle.ts || candle.time);
                return null;
              }
              
              result = {
                time: timestamp, // lightweight-chartsの要件に合わせてtimeとして設定
                open: parseFloat(String(candle.open)),
                high: parseFloat(String(candle.high)),
                low: parseFloat(String(candle.low)),
                close: parseFloat(String(candle.close)),
                volume: parseFloat(String(candle.volume || candle.vol || '0'))
              };
            }
            
            // 全ての値が有効か確認
            if (isNaN(result.open) || isNaN(result.high) || isNaN(result.low) || isNaN(result.close)) {
              if (IS_DEV) console.warn('Skipping candle with NaN values:', result);
              return null;
            }
            
            return result;
          } catch (err) {
            if (IS_DEV) console.error('Error processing candle data:', err, candle);
            return null;
          }
        })
        .filter((candle: any): candle is OHLCData => candle !== null) // nullを除外
        .sort((a: OHLCData, b: OHLCData) => a.time - b.time); // 時間順にソート
      
      if (processedData.length === 0) {
        throw new Error('No valid candle data found');
      }
      
      if (IS_DEV) console.log('Processed candle data:', processedData);
      return processedData;
    } catch (error) {
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
  /**
   * オーダーブックデータを取得する
   * @param symbol 通貨ペア (例: 'BTC/USDT')
   * @param exchangeType 取引種別 (デフォルトはインスタンスの設定値)
   * @returns オーダーブックデータ
   */
  async getOrderBook(
    symbol: string,
    exchangeType: ExchangeType = this.exchangeType
  ): Promise<OrderBookData> {
    try {
      // シンボルを正しい形式に変換（スラッシュを削除）
      const formattedSymbol = symbol.replace('/', '').toUpperCase();
      
      // パラメータの準備
      const browserParams = {
        symbol: formattedSymbol,
        type: exchangeType,
      };
      
      // サーバー側用のパラメータ
      const serverParams = exchangeType === 'spot'
        ? { symbol: formattedSymbol, limit: '150' }
        : { symbol: `${formattedSymbol}_UMCBL`, limit: '150' };
      
      // エンドポイントの準備
      const serverEndpoint = exchangeType === 'spot'
        ? '/api/v2/spot/market/orderbook'
        : '/api/v2/mix/market/orderbook';
      
      // キャンセル可能なリクエストを作成
      const { signal } = createCancellableRequest();
      
      // 共通API関数を使用してデータを取得
      const responseData = await adaptiveApiRequest({
        browserEndpoint: '/api/bitget/orderbook',
        serverBaseUrl: BITGET_API_BASE_URL,
        serverEndpoint,
        params: IS_BROWSER ? browserParams : serverParams,
        options: {
          method: 'GET',
          errorTitle: 'オーダーブック取得エラー',
          errorDescription: `${symbol} のオーダーブック取得に失敗しました`,
          showToast: IS_DEV,
          signal,
          fallbackData: null
        }
      });
      
      // レスポンスの構造を査定して適切に処理
      if (IS_DEV) console.log('OrderBook API Response:', responseData);
      
      // レスポンスデータの変換
      let orderBookData;
      
      // 様々なレスポンス構造に対応
      if (responseData?.data?.data) {
        // { data: { data: {...} } } 形式
        orderBookData = responseData.data.data;
      } else if (responseData?.data) {
        // { data: {...} } 形式
        orderBookData = responseData.data;
      } else {
        // 直接データが返される場合
        orderBookData = responseData;
      }
      
      if (!orderBookData) {
        if (IS_DEV) console.error('Empty OrderBook API response');
        throw new Error('Empty OrderBook API response');
      }
      
      // asksとbidsが存在するか確認
      // 様々なプロパティ名に対応
      const asks = orderBookData.asks || orderBookData.askList || orderBookData.sellOrders || [];
      const bids = orderBookData.bids || orderBookData.bidList || orderBookData.buyOrders || [];
      
      if (!asks.length || !bids.length) {
        if (IS_DEV) console.error('Invalid orderbook data format', orderBookData);
        throw new Error('Invalid orderbook data format');
      }
      
      // データを正規化
      orderBookData = {
        ...orderBookData,
        asks,
        bids
      };
      
      // OrderBookDataに変換
      return {
        symbol: symbol,
        timestamp: parseInt(orderBookData.timestamp || Date.now().toString()),
        asks: (orderBookData.asks || []).map((ask: string[]) => ({
          price: parseFloat(ask[0]),
          amount: parseFloat(ask[1])
        })),
        bids: (orderBookData.bids || []).map((bid: string[]) => ({
          price: parseFloat(bid[0]),
          amount: parseFloat(bid[1])
        }))
      };
    } catch (error) {
      // エラーを伝播
      throw error;
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
        if (IS_DEV) console.log('BitgetWS: Connection established');
        this.sendPing();
        this.pingInterval = setInterval(() => this.sendPing(), 15000);
        this.isInDemoMode = false; // 接続成功したらデモモードをオフ
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

      // --- onerror ---
      // ブラウザは接続断時などに中身のない ErrorEvent を投げるだけなので、
      // ここでは詳細ログを出さず onclose に任せる。
      this.ws.onerror = (ev) => {
        // グローバルエラーハンドラーを使用
        handleWebSocketError(ev, {
          title: 'WebSocket接続エラー',
          // 本番環境ではトースト通知を抑制
          showToast: false,
          // 開発環境のみコンソールに出力
          logToConsole: IS_DEV
        });
        // oncloseイベントが発火するので、ここでは何もしない
      };

      this.ws.onclose = (ev) => {
        // 正常終了（コード1000）の場合は警告しない
        const isNormalClosure = ev.code === 1000;
        
        if (IS_DEV || !isNormalClosure) {
          console.log(`BitgetWS: Connection closed (code=${ev.code}, reason=${ev.reason})`);
        }
        
        this.cleanup();
        
        // 異常終了の場合のみ再接続を試みる
        if (!isNormalClosure) {
          this.reconnect();
        }
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
      ? TIMEFRAME_MAP_SPOT[timeframe]
      : TIMEFRAME_MAP_FUTURES[timeframe];

    // ガード: 未対応のtimeframeならエラーを投げて早期リターン
    if (!bitgetTimeframe) {
      console.error(`Unsupported timeframe "${timeframe}" for ${this.exchangeType}`);
      return;
    }

    // --- instType / instId (v2 spec) ---
    // Official docs: 'SP' (spot), 'MC' (USDT‑M perpetual)
    const instType = this.exchangeType === 'spot' ? 'SP' : 'MC';
    const instId   = this.exchangeType === 'spot'
      ? formattedSymbol
      : `${formattedSymbol}_UMCBL`;

    const channelName = `candle${bitgetTimeframe}`;

    // 以前のサブスクリプションがある場合は解除（ただし WS が OPEN の時だけ）
    if (this.currentSubscription) {
      const prev = this.currentSubscription;
      // 同じチャンネルへ再購読ならスキップ
      if (
        prev.instType === instType &&
        prev.channel === channelName &&
        prev.instId === instId
      ) {
        console.log('BitgetWS: Same channel already subscribed, skip');
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const unsubscribeMsg = {
          op: 'unsubscribe',
          args: [
            {
              instType: prev.instType,
              channel: prev.channel,
              instId: prev.instId
            }
          ]
        };
        this.safeSend(unsubscribeMsg);
        if (IS_DEV) console.log('BitgetWS: Unsubscribed previous channel');
      }
    }

    const subscriptionMessage = {
      op: 'subscribe',
      args: [
        {
          instType: instType,
          channel: channelName,
          instId: instId
        }
      ]
    };

    // 現在の購読情報を保存
    this.currentSubscription = { instType, channel: channelName, instId };

    // 重複送信を避けるため、CONNECTING 状態で既に同一メッセージがキューされていれば送信しない
    if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
      // open イベントに登録されている sendAction の数をチェック
      // @ts-ignore: accessing private listener list (browser only)
      const listeners = this.ws._listeners?.open || [];
      const alreadyQueued = listeners.some((l:any) =>
        l.toString().includes(JSON.stringify(subscriptionMessage))
      );
      if (alreadyQueued) {
        if (IS_DEV) console.log('BitgetWS: Subscription already queued, skip duplicate');
        return;
      }
    }

    console.log('BitgetWS: Sending subscription message:', JSON.stringify(subscriptionMessage));

    // メッセージを送信（接続済みなら即送信、CONNECTING なら safeSend が onopen で発火）
    this.safeSend(subscriptionMessage);
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log(`Subscribed to ${this.exchangeType} ${formattedSymbol} ${timeframe} candles`);
    } else {
      console.log(`Queued subscription for ${formattedSymbol} ${timeframe} — will send on WebSocket open`);
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
    // V2 APIのpingメッセージやpongレスポンスの処理
    if (typeof message === 'string') {
      if (message === 'pong') {
        if (IS_DEV) console.log('BitgetWS: pong handled');
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
      // 30016 や 30015 は購読パラメータ重複などの軽微エラーなので warn に落とす
      console.warn(`BitgetWS: code=${message.code}, msg=${message.msg}`);
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
      if (IS_DEV) console.log('BitgetWS: Ping sent');
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

  /**
   * WebSocketの再接続を試みる
   * @param delay 再接続までの待機時間（ミリ秒）
   */
  private reconnect(delay: number = 5000) {
    if (!this.reconnectInterval) {
      if (IS_DEV) console.log(`BitgetWS: Attempting to reconnect in ${delay/1000}s...`);
      
      this.reconnectInterval = setTimeout(() => {
        // 最後に使用していたシンボルとタイムフレームで再接続
        const symbol = this.lastSymbol || 'BTC/USDT';
        const timeframe = this.lastTimeframe || '1m';
        
        this.connectWebSocket(symbol, timeframe, this.exchangeType);
        this.reconnectInterval = null;
      }, delay);
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