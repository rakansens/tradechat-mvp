/**
 * services/socket/mock-service.ts
 * テスト用のモックデータ生成を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: service.tsからモックデータ生成機能を分離
 */

import { EventEmitter } from 'events';
import { OrderBookData, OrderBookEntry } from '@/types/common/orderbook';
import { OHLCData, Timeframe } from '@/types/chart';
import { ProductType } from '@/types/api';
import { logger } from '@/utils/common';
import { ISocketService } from './interfaces';

/**
 * モックWebSocketサービスクラス
 * テスト用のモックデータ生成を担当
 */
export class MockSocketService extends EventEmitter implements ISocketService {
  private connected: boolean = false;
  private mockInterval: NodeJS.Timeout | null = null;
  private mockSubscriptions: Map<string, Function> = new Map();

  /**
   * マーケットデータ用のWebSocket接続を初期化
   * @returns null（モックサービスなのでSocket.IOインスタンスは返さない）
   */
  initializeMarketSocket() {
    this.connect();
    return null;
  }

  /**
   * BitgetAPIクライアントを初期化
   * @returns モックBitgetAPIクライアント
   */
  initializeApiClient() {
    // モック実装なので何も返さない
    return {} as any;
  }

  /**
   * 現在のBitgetAPIクライアントを取得
   * @returns null（モックサービスなのでAPIクライアントは返さない）
   */
  getCurrentApiClient() {
    return null;
  }

  /**
   * 接続状態を確認
   * @returns 接続状態
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * モックWebSocket接続を確立
   */
  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      this.connected = true;
      logger.info('モックWebSocketサービスが接続されました', {
        component: 'MockSocketService',
        action: 'connect'
      });
      
      // モックデータの配信を開始
      this.startMockDataBroadcast();
      
      this.emit('connected');
    } catch (error) {
      logger.error(`モックWebSocket接続エラー: ${error}`, {
        component: 'MockSocketService',
        action: 'connect',
        error
      });
      throw error;
    }
  }

  /**
   * モックWebSocket接続を切断
   */
  disconnect(): void {
    if (!this.connected) return;
    
    try {
      this.connected = false;
      
      // モックデータの配信を停止
      this.stopMockDataBroadcast();
      
      logger.info('モックWebSocketサービスが切断されました', {
        component: 'MockSocketService',
        action: 'disconnect'
      });
      
      this.emit('disconnected');
    } catch (error) {
      logger.error(`モックWebSocket切断エラー: ${error}`, {
        component: 'MockSocketService',
        action: 'disconnect',
        error
      });
    }
  }

  /**
   * すべての接続を切断
   */
  disconnectAll(): void {
    this.disconnect();
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    if (!this.connected) {
      setTimeout(() => this.connect(), 1000);
    }
  }

  /**
   * すべての購読を再購読
   */
  resubscribeAll(): void {
    // モック実装では何もしない
  }

  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ProductType = 'spot'
  ): () => void {
    const subKey = `orderbook:${symbol}:${exchangeType}`;
    this.mockSubscriptions.set(subKey, callback);
    
    logger.info(`モックオーダーブック購読開始: ${symbol} (${exchangeType})`, {
      component: 'MockSocketService',
      action: 'subscribeOrderBook',
      symbol,
      exchangeType
    });
    
    return () => {
      this.mockSubscriptions.delete(subKey);
      logger.info(`モックオーダーブック購読解除: ${symbol} (${exchangeType})`, {
        component: 'MockSocketService',
        action: 'unsubscribeOrderBook',
        symbol,
        exchangeType
      });
    };
  }

  /**
   * ローソク足データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe 時間枠（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ProductType = 'spot'
  ): () => void {
    const subKey = `kline:${symbol}:${timeframe}:${exchangeType}`;
    this.mockSubscriptions.set(subKey, callback);
    
    logger.info(`モックローソク足購読開始: ${symbol} ${timeframe} (${exchangeType})`, {
      component: 'MockSocketService',
      action: 'subscribeKline',
      symbol,
      timeframe,
      exchangeType
    });
    
    return () => {
      this.mockSubscriptions.delete(subKey);
      logger.info(`モックローソク足購読解除: ${symbol} ${timeframe} (${exchangeType})`, {
        component: 'MockSocketService',
        action: 'unsubscribeKline',
        symbol,
        timeframe,
        exchangeType
      });
    };
  }

  /**
   * モックデータの配信を開始
   */
  private startMockDataBroadcast(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
    }
    
    this.mockInterval = setInterval(() => {
      this.broadcastMockData();
    }, 3000);
    
    logger.info('モックデータの配信を開始しました', {
      component: 'MockSocketService',
      action: 'startMockDataBroadcast'
    });
  }

  /**
   * モックデータの配信を停止
   */
  private stopMockDataBroadcast(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
      
      logger.info('モックデータの配信を停止しました', {
        component: 'MockSocketService',
        action: 'stopMockDataBroadcast'
      });
    }
  }

  /**
   * モックデータを配信
   */
  private broadcastMockData(): void {
    if (!this.connected || this.mockSubscriptions.size === 0) {
      return;
    }
    
    // 購読ごとにモックデータを生成して配信
    for (const [subKey, callback] of this.mockSubscriptions.entries()) {
      const [type, symbol, ...rest] = subKey.split(':');
      
      if (type === 'orderbook') {
        const orderBookData = this.generateMockOrderBook(symbol);
        (callback as (data: OrderBookData) => void)(orderBookData);
      } else if (type === 'kline') {
        const timeframe = rest[0] as Timeframe;
        const klineData = this.generateMockKline(symbol, timeframe);
        (callback as (data: OHLCData) => void)(klineData);
      }
    }
  }

  /**
   * モックオーダーブックデータを生成
   * @param symbol シンボル
   * @returns モックオーダーブックデータ
   */
  private generateMockOrderBook(symbol: string): OrderBookData {
    const basePrice = symbol.includes('BTC') ? 50000 : 2000;
    const timestamp = Date.now();
    
    // ランダムな価格変動を生成
    const randomFactor = 0.995 + Math.random() * 0.01; // 0.995 ~ 1.005
    const currentPrice = basePrice * randomFactor;
    
    // オーダーブックデータを生成
    const asks: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => ({
      price: currentPrice * (1 + 0.0001 * (i + 1)),
      amount: Math.random() * 10
    }));
    
    const bids: OrderBookEntry[] = Array.from({ length: 10 }, (_, i) => ({
      price: currentPrice * (1 - 0.0001 * (i + 1)),
      amount: Math.random() * 10
    }));
    
    return {
      symbol,
      timestamp,
      asks,
      bids
    };
  }

  /**
   * モックローソク足データを生成
   * @param symbol シンボル
   * @param timeframe 時間枠
   * @returns モックローソク足データ
   */
  private generateMockKline(symbol: string, timeframe: Timeframe): OHLCData {
    const basePrice = symbol.includes('BTC') ? 50000 : 2000;
    const currentTimestamp = Date.now();
    
    // ランダムな価格変動を生成
    const randomFactor = 0.995 + Math.random() * 0.01; // 0.995 ~ 1.005
    const currentPrice = basePrice * randomFactor;
    
    // 価格範囲を生成
    const range = currentPrice * 0.002; // 0.2%の範囲
    const open = currentPrice - range / 2;
    const close = currentPrice + range / 2;
    const high = Math.max(open, close) + range * 0.3;
    const low = Math.min(open, close) - range * 0.3;
    const volume = Math.random() * 100;
    
    // OHLCData型に合わせて返す
    // symbolとtimeframeはメタデータとして使用し、実際のOHLCDataには含めない
    return {
      time: currentTimestamp,
      open,
      high,
      low,
      close,
      volume
    };
  }
}

// シングルトンインスタンス
let mockSocketServiceInstance: MockSocketService | null = null;

/**
 * MockSocketServiceのシングルトンインスタンスを取得
 * @returns MockSocketServiceインスタンス
 */
export function getMockSocketService(): MockSocketService {
  if (!mockSocketServiceInstance) {
    mockSocketServiceInstance = new MockSocketService();
  }
  return mockSocketServiceInstance;
}
