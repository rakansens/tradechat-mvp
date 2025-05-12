/**
 * services/data/hybridChartService.ts
 * ハイブリッドチャートサービスの実装
 * 
 * 作成: 2025-05-12 - 業界のベストプラクティスに沿ったハイブリッドチャートデータ取得サービス
 * 
 * このサービスは以下の機能を提供します：
 * 1. REST APIを使用して過去の確定ローソク足データを取得
 * 2. WebSocketを使用して最新の未確定ローソク足データをリアルタイム更新
 * 3. 両方のデータを統合して完全なチャートデータを提供
 */

import { EventEmitter } from 'events';
import { BitgetApiClient } from '../bitgetApi';
import { BitgetWebSocketClientV2 } from '../bitget';
import { ExchangeType } from '../../types/api';
import { OHLCData, Timeframe } from '../../types/chart';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../lib/utils';
import { cacheService } from '../cache';

/**
 * ハイブリッドチャートサービス
 * 業界のベストプラクティスに沿った実装
 */
export class HybridChartService extends EventEmitter {
  private wsClient: BitgetWebSocketClientV2;
  private apiClient: BitgetApiClient;
  private activeSubscriptions: Map<string, boolean> = new Map();
  private chartData: Map<string, OHLCData[]> = new Map();
  
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    this.wsClient = new BitgetWebSocketClientV2();
    this.apiClient = new BitgetApiClient();
    
    // WebSocket接続を確立
    this.wsClient.connect().catch(error => {
      logger.error(`WebSocket接続の確立に失敗しました: ${error}`, {
        component: 'HybridChartService',
        action: 'constructor',
        error
      });
    });
    
    // WebSocketからのローソク足データを処理
    this.wsClient.on('candle', (symbol, timeframe, candleData) => {
      this.handleRealtimeCandleUpdate(symbol, timeframe as Timeframe, {
        timestamp: candleData.timestamp,
        open: parseFloat(candleData.open),
        high: parseFloat(candleData.high),
        low: parseFloat(candleData.low),
        close: parseFloat(candleData.close),
        volume: parseFloat(candleData.volume)
      });
    });
  }
  
  /**
   * チャートデータを取得（ハイブリッドアプローチ）
   * 
   * 1. 過去データをREST APIから取得
   * 2. リアルタイムデータの購読を開始
   * 3. 統合されたデータを返す
   */
  async getChartData(
    symbol: string,
    timeframe: Timeframe,
    exchangeType: ExchangeType = 'spot',
    limit: number = 100
  ): Promise<OHLCData[]> {
    const normalizedSymbol = normalizeSymbol(symbol);
    const requestKey = `${normalizedSymbol}-${timeframe}-${exchangeType}`;
    
    try {
      // 1. REST APIで過去データを取得
      const historicalData = await this.fetchHistoricalData(
        normalizedSymbol,
        timeframe,
        exchangeType,
        limit
      );
      
      // 2. チャートデータを保存
      this.chartData.set(requestKey, historicalData);
      
      // 3. WebSocketでリアルタイムデータの購読を開始
      this.subscribeRealtimeData(normalizedSymbol, timeframe);
      
      return historicalData;
    } catch (error) {
      logger.error(`チャートデータの取得に失敗しました: ${error}`, {
        component: 'HybridChartService',
        action: 'getChartData',
        symbol: normalizedSymbol,
        timeframe,
        exchangeType,
        error
      });
      throw error;
    }
  }
  
  /**
   * REST APIを使用して過去のローソク足データを取得
   */
  private async fetchHistoricalData(
    symbol: string,
    timeframe: Timeframe,
    exchangeType: ExchangeType,
    limit: number
  ): Promise<OHLCData[]> {
    try {
      // キャッシュキー
      const cacheKey = `chart-${symbol}-${timeframe}-${exchangeType}`;
      
      // キャッシュをチェック
      const cachedData = cacheService.get<OHLCData[]>(cacheKey);
      if (cachedData) {
        logger.debug(`キャッシュからチャートデータを取得: ${symbol} ${timeframe}`, {
          component: 'HybridChartService',
          action: 'fetchHistoricalData',
          dataCount: cachedData.length
        });
        return cachedData;
      }
      
      // REST APIを使用して過去データを取得
      const startTime = Date.now();
      const candles = await this.wsClient.fetchHistoricalCandles(symbol, timeframe, limit);
      const endTime = Date.now();
      
      // OHLCData形式に変換
      const ohlcData: OHLCData[] = candles.map(candle => ({
        timestamp: candle.timestamp,
        open: parseFloat(candle.open),
        high: parseFloat(candle.high),
        low: parseFloat(candle.low),
        close: parseFloat(candle.close),
        volume: parseFloat(candle.volume)
      }));
      
      // キャッシュに保存
      cacheService.set(cacheKey, ohlcData, 'rest');
      
      logger.debug(`REST APIからチャートデータを取得: ${symbol} ${timeframe}`, {
        component: 'HybridChartService',
        action: 'fetchHistoricalData',
        dataCount: ohlcData.length,
        duration: endTime - startTime
      });
      
      return ohlcData;
    } catch (error) {
      logger.error(`過去のローソク足データの取得に失敗しました: ${error}`, {
        component: 'HybridChartService',
        action: 'fetchHistoricalData',
        symbol,
        timeframe,
        exchangeType,
        error
      });
      throw error;
    }
  }
  
  /**
   * WebSocketを使用してリアルタイムデータを購読
   */
  private subscribeRealtimeData(symbol: string, timeframe: Timeframe): void {
    const subscriptionKey = `${symbol}-${timeframe}`;
    
    // 既に購読中の場合は何もしない
    if (this.activeSubscriptions.get(subscriptionKey)) {
      return;
    }
    
    try {
      // WebSocketでローソク足データを購読
      this.wsClient.subscribeCandles(symbol, timeframe);
      this.activeSubscriptions.set(subscriptionKey, true);
      
      logger.debug(`リアルタイムローソク足データの購読を開始: ${symbol} ${timeframe}`, {
        component: 'HybridChartService',
        action: 'subscribeRealtimeData'
      });
    } catch (error) {
      logger.error(`リアルタイムデータの購読に失敗しました: ${error}`, {
        component: 'HybridChartService',
        action: 'subscribeRealtimeData',
        symbol,
        timeframe,
        error
      });
    }
  }
  
  /**
   * リアルタイムローソク足データの更新を処理
   */
  private handleRealtimeCandleUpdate(
    symbol: string,
    timeframe: Timeframe,
    candleData: OHLCData
  ): void {
    const requestKey = `${symbol}-${timeframe}-spot`;
    
    // 保存されているチャートデータを取得
    const chartData = this.chartData.get(requestKey);
    if (!chartData) {
      return;
    }
    
    // 最新のローソク足を更新または追加
    const existingCandleIndex = chartData.findIndex(
      candle => candle.timestamp === candleData.timestamp
    );
    
    if (existingCandleIndex !== -1) {
      // 既存のローソク足を更新
      chartData[existingCandleIndex] = candleData;
    } else {
      // 新しいローソク足を追加
      chartData.push(candleData);
      // タイムスタンプでソート
      chartData.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    // 更新されたデータを保存
    this.chartData.set(requestKey, chartData);
    
    // キャッシュも更新
    const cacheKey = `chart-${symbol}-${timeframe}-spot`;
    cacheService.set(cacheKey, chartData, 'websocket');
    
    // イベントを発火して更新を通知
    this.emit('candle_update', symbol, timeframe, candleData, chartData);
    
    logger.debug(`リアルタイムローソク足データを更新: ${symbol} ${timeframe}`, {
      component: 'HybridChartService',
      action: 'handleRealtimeCandleUpdate',
      timestamp: new Date(candleData.timestamp).toISOString(),
      close: candleData.close
    });
  }
  
  /**
   * 購読を解除
   */
  unsubscribe(symbol: string, timeframe: Timeframe): void {
    const subscriptionKey = `${symbol}-${timeframe}`;
    
    if (this.activeSubscriptions.get(subscriptionKey)) {
      // WebSocket購読を解除
      // 注意: 現在のBitgetWebSocketClientV2には購読解除メソッドがないため、
      // 将来的に実装される場合は以下のコメントを解除
      // this.wsClient.unsubscribeCandles(symbol, timeframe);
      
      this.activeSubscriptions.set(subscriptionKey, false);
      
      logger.debug(`ローソク足データの購読を解除: ${symbol} ${timeframe}`, {
        component: 'HybridChartService',
        action: 'unsubscribe'
      });
    }
  }
  
  /**
   * すべての購読を解除
   */
  unsubscribeAll(): void {
    // すべての購読を解除
    this.activeSubscriptions.clear();
    
    // WebSocket接続を閉じる
    this.wsClient.disconnect();
    
    logger.debug('すべてのローソク足データの購読を解除', {
      component: 'HybridChartService',
      action: 'unsubscribeAll'
    });
  }
}

// シングルトンインスタンスをエクスポート
export const hybridChartService = new HybridChartService();
