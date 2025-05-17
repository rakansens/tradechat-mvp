/**
 * services/api/chart-data-service.ts
 * チャートデータサービス実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたチャートデータサービスの実装
 * 更新: 2025-05-12 - WebSocketクライアントインターフェースの変更に対応
 * 
 * このファイルは、IChartDataServiceインターフェースに準拠したチャートデータサービスを実装します。
 * 単一責任の原則（SRP）に基づき、チャートデータの取得と管理のみに責任を持ちます。
 */

import { EventEmitter } from 'events';
import { ExchangeType } from '@/types/api';
import { OHLCData, OrderBookData, Timeframe } from '@/types/chart';
import { IChartDataService } from './interfaces';
import { dataSourceFactory } from './data-source-factory';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../utils/formatters';

// キャッシュサービスのインポート
import { cacheService } from '../cache/service';

/**
 * チャートデータサービス
 * IChartDataServiceインターフェースを実装
 */
export class ChartDataService extends EventEmitter implements IChartDataService {
  // アクティブな購読を管理
  private activeSubscriptions: Map<string, boolean> = new Map();
  
  // チャートデータを保持
  private chartData: Map<string, OHLCData[]> = new Map();
  
  // コールバック関数を保持
  private callbacks: Map<string, Set<(data: OHLCData) => void>> = new Map();
  
  /**
   * コンストラクタ
   */
  constructor() {
    super();
    
    // WebSocketクライアントからのローソク足データを処理
    const wsClient = dataSourceFactory.getWebSocketClient();
    
    // WebSocket接続を確立
    wsClient.connect().catch(error => {
      logger.error(`WebSocket接続の確立に失敗しました: ${error}`, {
        component: 'ChartDataService',
        action: 'constructor',
        error
      });
    });
    
    // WebSocketからのローソク足データを処理
    wsClient.on('candle', (symbol, timeframe, candleData) => {
      this.handleRealtimeCandleUpdate(symbol, timeframe as Timeframe, candleData);
    });
  }
  
  /**
   * チャートデータを取得（ハイブリッドアプローチ）
   * 
   * 1. 過去データをREST APIから取得
   * 2. リアルタイムデータの購読を開始
   * 3. 統合されたデータを返す
   * 
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param exchangeType 取引タイプ（デフォルト: 'spot'）
   * @param limit 取得件数（デフォルト: 100）
   * @returns チャートデータの配列
   */
  public async getChartData(
    symbol: string,
    timeframe: Timeframe,
    exchangeType: ExchangeType = 'bitget',
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
        component: 'ChartDataService',
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
   * リアルタイムチャートデータを購読
   * 
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  public subscribeRealtimeChartData(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void
  ): () => void {
    const normalizedSymbol = normalizeSymbol(symbol);
    const subscriptionKey = `${normalizedSymbol}-${timeframe}`;
    
    // コールバック関数を登録
    if (!this.callbacks.has(subscriptionKey)) {
      this.callbacks.set(subscriptionKey, new Set());
    }
    
    const callbackSet = this.callbacks.get(subscriptionKey)!;
    callbackSet.add(callback);
    
    // WebSocketでリアルタイムデータの購読を開始
    this.subscribeRealtimeData(normalizedSymbol, timeframe);
    
    // 購読解除関数を返す
    return () => {
      const callbackSet = this.callbacks.get(subscriptionKey);
      if (callbackSet) {
        callbackSet.delete(callback);
        
        // コールバックがなくなった場合は購読を解除
        if (callbackSet.size === 0) {
          this.callbacks.delete(subscriptionKey);
          this.unsubscribeRealtimeData(normalizedSymbol, timeframe);
        }
      }
    };
  }
  
  /**
   * すべての購読を解除
   */
  public unsubscribeAll(): void {
    // すべての購読を解除
    this.activeSubscriptions.clear();
    this.callbacks.clear();
    
    // WebSocket接続を閉じる
    const wsClient = dataSourceFactory.getWebSocketClient();
    wsClient.disconnect();
    
    logger.debug('すべてのローソク足データの購読を解除', {
      component: 'ChartDataService',
      action: 'unsubscribeAll'
    });
  }
  
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  public async getOrderBook(symbol: string, exchangeType: ExchangeType): Promise<OrderBookData> {
    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // キャッシュキー
      const cacheKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
      
      // キャッシュをチェック
      const cachedData = cacheService.get<OrderBookData>(cacheKey);
      if (cachedData) {
        logger.debug(`キャッシュからオーダーブックデータを取得: ${normalizedSymbol}`, {
          component: 'ChartDataService',
          action: 'getOrderBook'
        });
        return cachedData;
      }
      
      // REST APIクライアントを取得
      const restClient = dataSourceFactory.getRestApiClient();
      
      // オーダーブックデータを取得
      const orderBookData = await restClient.getOrderBook(normalizedSymbol, exchangeType);
      
      // キャッシュに保存 (オーダーブックは短時間で更新されるため、TTLは短く設定)
      cacheService.set(cacheKey, orderBookData, 'rest', 10); // 10秒間キャッシュ
      
      return orderBookData;
    } catch (error) {
      logger.error(`オーダーブックデータの取得に失敗しました: ${error}`, {
        component: 'ChartDataService',
        action: 'getOrderBook',
        symbol,
        exchangeType,
        error
      });
      
      // エラーイベントを発行
      this.emit('error', error);
      
      // 空のオーダーブックを返す
      return {
        asks: [],
        bids: [],
        timestamp: Date.now(),
        symbol
      };
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
          component: 'ChartDataService',
          action: 'fetchHistoricalData',
          dataCount: cachedData.length
        });
        return cachedData;
      }
      
      // REST APIクライアントを取得
      const restClient = dataSourceFactory.getRestApiClient();
      
      // REST APIを使用して過去データを取得
      const startTime = Date.now();
      const ohlcData = await restClient.getHistoricalCandles(symbol, timeframe, limit);
      const endTime = Date.now();
      
      // キャッシュに保存
      cacheService.set(cacheKey, ohlcData, 'rest');
      
      logger.debug(`REST APIからチャートデータを取得: ${symbol} ${timeframe}`, {
        component: 'ChartDataService',
        action: 'fetchHistoricalData',
        dataCount: ohlcData.length,
        duration: endTime - startTime
      });
      
      return ohlcData;
    } catch (error) {
      logger.error(`過去のローソク足データの取得に失敗しました: ${error}`, {
        component: 'ChartDataService',
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
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   */
  private subscribeRealtimeData(symbol: string, timeframe: Timeframe): void {
    const subscriptionKey = `${symbol}-${timeframe}`;
    
    // 既に購読中の場合は何もしない
    if (this.activeSubscriptions.get(subscriptionKey)) {
      return;
    }
    
    try {
      // WebSocketクライアントを取得
      const wsClient = dataSourceFactory.getWebSocketClient();
      
      // WebSocketでローソク足データを購読
      wsClient.subscribeCandles(symbol, timeframe, (candleData: OHLCData) => {
        // 受信したデータを処理
        this.handleRealtimeCandleUpdate(symbol, timeframe, candleData);
      });
      
      this.activeSubscriptions.set(subscriptionKey, true);
      
      logger.debug(`リアルタイムローソク足データの購読を開始: ${symbol} ${timeframe}`, {
        component: 'ChartDataService',
        action: 'subscribeRealtimeData'
      });
    } catch (error) {
      logger.error(`リアルタイムデータの購読に失敗しました: ${error}`, {
        component: 'ChartDataService',
        action: 'subscribeRealtimeData',
        symbol,
        timeframe,
        error
      });
    }
  }
  
  /**
   * リアルタイムデータの購読を解除
   */
  private unsubscribeRealtimeData(symbol: string, timeframe: Timeframe): void {
    const subscriptionKey = `${symbol}-${timeframe}`;
    
    if (this.activeSubscriptions.get(subscriptionKey)) {
      // WebSocket購読を解除
      // 注意: 現在のBitgetWebSocketClientには購読解除メソッドがないため、
      // 将来的に実装される場合は以下のコメントを解除
      // this.wsClient.unsubscribeCandles(symbol, timeframe);
      
      this.activeSubscriptions.delete(subscriptionKey);
      
      logger.debug(`リアルタイムローソク足データの購読を解除: ${symbol} ${timeframe}`, {
        component: 'ChartDataService',
        action: 'unsubscribeRealtimeData'
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
    try {
      const subscriptionKey = `${symbol}-${timeframe}`;
      const requestKey = `${symbol}-${timeframe}-spot`; // デフォルトはスポット取引
      
      // 既存のデータを取得
      let existingData = this.chartData.get(requestKey) || [];
      
      // データを更新
      existingData = this.updateCandleData(existingData, candleData);
      
      // 更新されたデータを保存
      this.chartData.set(requestKey, existingData);
      
      // コールバック関数を呼び出し
      const callbacks = this.callbacks.get(subscriptionKey);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(candleData);
          } catch (callbackError) {
            logger.error(`コールバック関数の実行中にエラーが発生しました: ${callbackError}`, {
              component: 'ChartDataService',
              action: 'handleRealtimeCandleUpdate',
              error: callbackError
            });
          }
        });
      }
      
      // 更新イベントを発行
      this.emit('candleUpdate', symbol, timeframe, candleData);
      
      if (callbacks && callbacks.size > 0) {
        logger.debug(`リアルタイムローソク足データを更新: ${symbol} ${timeframe}`, {
          component: 'ChartDataService',
          action: 'handleRealtimeCandleUpdate',
          callbackCount: callbacks.size
        });
      }
    } catch (error) {
      logger.error(`リアルタイムローソク足データの処理中にエラーが発生しました: ${error}`, {
        component: 'ChartDataService',
        action: 'handleRealtimeCandleUpdate',
        symbol,
        timeframe,
        error
      });
    }
  }
  
  /**
   * ローソク足データを更新
   */
  private updateCandleData(existingData: OHLCData[], newCandle: OHLCData): OHLCData[] {
    // データが空の場合は新しいデータを追加
    if (!existingData.length) {
      return [newCandle];
    }
    
    // 同じタイムスタンプのローソク足を検索
    const index = existingData.findIndex(candle => candle.time === newCandle.time);
    
    if (index >= 0) {
      // 既存のローソク足を更新
      existingData[index] = newCandle;
    } else {
      // 新しいローソク足を追加
      existingData.push(newCandle);
      
      // 時間順にソート
      existingData.sort((a, b) => a.time - b.time);
    }
    
    return existingData;
  }
}

// シングルトンインスタンスをエクスポート
export const chartDataService = new ChartDataService();
