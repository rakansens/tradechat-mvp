/**
 * services/ws/bitget-feed.ts
 * Bitget WebSocketフィードサービス
 * 
 * - ロウソク足チャートデータのリアルタイム購読
 * - ロウソク足データの正規化・更新処理
 */

import { getBitgetWebSocketClient } from './bitget-client';
import { upsertCandle } from '@/utils/updateCandles';
import { Candle } from '@/utils/normalizeCandles';
import { logger } from '@/utils/logger';
import { useChartDataStore } from '@/store';

// サポートされるタイムフレーム
export const SUPPORTED_TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d', '1w'] as const;
export type TimeFrame = typeof SUPPORTED_TIMEFRAMES[number];

/**
 * BitgetのWebSocketフィードマネージャー
 */
export class BitgetFeedManager {
  private client = getBitgetWebSocketClient();
  private currentSymbol: string | null = null;
  private currentTimeframe: TimeFrame | null = null;
  private isSubscribed = false;
  
  constructor() {
    // WebSocketクライアントにメッセージハンドラを登録
    this.client.onMessage(this.handleMessage.bind(this));
  }
  
  /**
   * ロウソク足データの購読を開始
   */
  subscribeToCandles(symbol: string, timeframe: TimeFrame): void {
    if (!this.client.isConnected()) {
      logger.info('WebSocket接続を開始します');
      this.client.connect();
    }
    
    if (this.isSubscribed && this.currentSymbol === symbol && this.currentTimeframe === timeframe) {
      logger.info(`同じシンボル/タイムフレームが既に購読中: ${symbol}/${timeframe}`);
      return;
    }
    
    // 前の購読があれば解除
    if (this.isSubscribed) {
      this.unsubscribe();
    }
    
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;
    
    // Bitget APIのkline（ロウソク足）チャンネルに購読
    // フォーマット: instType_instId_channel
    const channel = `candle${this.mapTimeframe(timeframe)}`;
    const instId = symbol.toUpperCase(); // e.g. 'BTCUSDT'
    
    const subscribeMessage = {
      op: "subscribe",
      args: [{
        instType: "sp",
        channel: channel,
        instId: instId
      }]
    };
    
    this.client.send(subscribeMessage);
    this.isSubscribed = true;
    
    logger.info(`購読開始: ${symbol}/${timeframe}`, {
      action: 'subscribe',
      symbol,
      timeframe
    });
  }
  
  /**
   * 購読を解除
   */
  unsubscribe(): void {
    if (!this.isSubscribed || !this.currentSymbol || !this.currentTimeframe) {
      return;
    }
    
    const channel = `candle${this.mapTimeframe(this.currentTimeframe)}`;
    const instId = this.currentSymbol.toUpperCase();
    
    const unsubscribeMessage = {
      op: "unsubscribe",
      args: [{
        instType: "sp",
        channel: channel,
        instId: instId
      }]
    };
    
    this.client.send(unsubscribeMessage);
    
    logger.info(`購読解除: ${this.currentSymbol}/${this.currentTimeframe}`, {
      action: 'unsubscribe',
      symbol: this.currentSymbol,
      timeframe: this.currentTimeframe
    });
    
    this.isSubscribed = false;
    this.currentSymbol = null;
    this.currentTimeframe = null;
  }
  
  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    if (this.isSubscribed) {
      this.unsubscribe();
    }
    this.client.disconnect();
  }
  
  /**
   * WebSocketメッセージの処理
   */
  private handleMessage(data: any): void {
    try {
      // システムメッセージ（接続確認応答など）の場合は無視
      if (data.event === 'login' || data.event === 'subscribe' || data.event === 'unsubscribe') {
        logger.debug('システムメッセージを受信:', data);
        return;
      }
      
      // ロウソク足データを受信した場合
      if (data.arg && data.arg.channel && data.arg.channel.startsWith('candle') && data.data) {
        this.processKlineData(data);
      }
    } catch (error) {
      logger.error('WebSocketメッセージ処理エラー:', error, { data });
    }
  }
  
  /**
   * Bitgetのロウソク足データを処理
   */
  private processKlineData(message: any): void {
    try {
      const { data } = message;
      
      if (!Array.isArray(data) || data.length === 0) {
        logger.warn('無効なロウソク足データを受信:', message);
        return;
      }
      
      // Bitgetのロウソク足データ形式
      // [timestamp, open, high, low, close, vol, turnover]
      const klineData = data[0];
      
      if (!Array.isArray(klineData) || klineData.length < 6) {
        logger.warn('不正なロウソク足データフォーマット:', klineData);
        return;
      }
      
      const [ts, open, high, low, close, volume] = klineData;
      
      // ロウソク足オブジェクトを作成
      const candle = {
        time: new Date(Number(ts)),  // 必ずDateオブジェクトとして作成
        open: parseFloat(open),
        high: parseFloat(high),
        low: parseFloat(low),
        close: parseFloat(close),
        volume: parseFloat(volume)
      };
      
      logger.debug('ロウソク足データを受信:', {
        ts,
        symbol: this.currentSymbol,
        timeframe: this.currentTimeframe
      });
      
      // ストアにデータを更新（updateWithCandleでデータの時系列整合性を保証）
      const chartDataStore = useChartDataStore.getState();
      chartDataStore.updateWithCandle(candle);
    } catch (error) {
      logger.error('ロウソク足データ処理エラー:', error);
    }
  }
  
  /**
   * タイムフレームをBitget API形式に変換
   */
  private mapTimeframe(timeframe: TimeFrame): string {
    // Bitgetのタイムフレーム形式にマッピング
    const mapping: Record<TimeFrame, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1H',
      '4h': '4H',
      '12h': '12H',
      '1d': '1D',
      '1w': '1W'
    };
    
    return mapping[timeframe] || '1m';
  }
}

// シングルトンインスタンス
let feedManagerInstance: BitgetFeedManager | null = null;

/**
 * BitgetFeedManagerのシングルトンインスタンスを取得
 */
export function getBitgetFeedManager(): BitgetFeedManager {
  if (!feedManagerInstance) {
    feedManagerInstance = new BitgetFeedManager();
  }
  return feedManagerInstance;
} 