/**
 * services/data/chart-data-service.ts
 * チャートデータサービスの実装
 * 
 * 作成: 2025-05-12 - チャートデータの取得と管理を担当するサービス
 * SRPに基づいてdataFetchServiceから分離
 */

import { EventEmitter } from 'events';
import { BitgetApiClient } from '../api/bitget/client';
import { IChartDataService } from './interfaces';
import { OHLCData, Timeframe } from '../../types/chart';
import { ExchangeType } from '@/types/api';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../utils/formatters';
import { getSocketService } from '../socket/index';
import { cacheService } from '../cache/service';

// 環境検出
const isBrowser = typeof window !== 'undefined';

/**
 * チャートデータサービス
 * チャートデータの取得と管理を担当するサービス
 */
class ChartDataService extends EventEmitter implements IChartDataService {
  private bitgetApiClient: BitgetApiClient | null = null;
  private subscriptions: Map<string, () => void> = new Map();
  
  /**
   * BitgetApiClientインスタンスを取得または作成
   */
  private getBitgetApiClient(): BitgetApiClient {
    if (!this.bitgetApiClient) {
      this.bitgetApiClient = new BitgetApiClient();
    }
    return this.bitgetApiClient;
  }
  
  /**
   * チャートデータ取得（ベストプラクティスに沿ったハイブリッドアプローチ）
   * 
   * 業界のベストプラクティスに従い、以下のアプローチを実装しています：
   * 1. 初期データはREST APIから取得（履歴データの一括取得に最適）
   * 2. リアルタイム更新はWebSocketで受信（低レイテンシーでリソース効率が良い）
   * 3. キャッシュ戦略で不要なネットワークリクエストを削減
   * 
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @param useCache キャッシュを使用するかどうか
   * @returns チャートデータの配列
   */
  async fetchChartData(
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType = 'bitget',
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> {
    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      const cacheKey = `chart_${normalizedSymbol}_${timeFrame}_${exchangeType}`;
      
      // キャッシュチェック
      if (useCache) {
        const cachedData = cacheService.get<OHLCData[]>(cacheKey);
        if (cachedData) {
          logger.debug('チャートデータをキャッシュから取得しました', {
            component: 'ChartDataService',
            action: 'fetchChartData',
            symbol: normalizedSymbol,
            timeFrame,
            exchangeType
          });
          return cachedData;
        }
      }
      
      // APIからデータ取得
      logger.info('チャートデータをAPIから取得します', {
        component: 'ChartDataService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType
      });
      
      let data: OHLCData[] = [];
      
      // 取引所に応じたデータ取得
      // BitgetApiClientを使用してデータを取得
      // 現時点ではspotとfuturesで同じAPIを使用
      const bitgetClient = this.getBitgetApiClient();
      data = await bitgetClient.fetchCandles(normalizedSymbol, timeFrame, 100, exchangeType);
      
      // キャッシュに保存
      if (data.length > 0 && useCache) {
        // キャッシュの期限を指定
        cacheService.set(cacheKey, data, 'rest', 60 * 5); // 5分間キャッシュ
      }
      
      return data;
    } catch (error) {
      logger.error('チャートデータの取得に失敗しました', {
        component: 'ChartDataService',
        action: 'fetchChartData',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
  
  /**
   * WebSocketを使用してローソク足データをリアルタイム購読
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeKlineRealtime(
    symbol: string,
    timeFrame: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'bitget'
  ): () => void {
    try {
      const normalizedSymbol = normalizeSymbol(symbol);
      const subscriptionKey = `kline_${normalizedSymbol}_${timeFrame}_${exchangeType}`;
      
      // 既存の購読があれば解除
      if (this.subscriptions.has(subscriptionKey)) {
        const unsubscribe = this.subscriptions.get(subscriptionKey);
        if (unsubscribe) unsubscribe();
        this.subscriptions.delete(subscriptionKey);
      }
      
      // ブラウザ環境ではWebSocketを使用
      if (isBrowser) {
        logger.info('ローソク足データのWebSocket購読を開始します', {
          component: 'ChartDataService',
          action: 'subscribeKlineRealtime',
          symbol: normalizedSymbol,
          timeFrame,
          exchangeType
        });
        
        const socketService = getSocketService();
        const unsubscribe = socketService.subscribeKline(
          normalizedSymbol,
          timeFrame,
          (data) => {
            // データを受信したらコールバックを呼び出す
            callback(data);
            
            // イベントも発火
            this.emit('kline', {
              symbol: normalizedSymbol,
              timeFrame,
              data
            });
          },
          exchangeType
        );
        
        // 購読を保存
        this.subscriptions.set(subscriptionKey, unsubscribe);
        return unsubscribe;
      } else {
      // サーバー環境では空の関数を返す
      // テスト環境でも確実にロガーが呼び出されるようにする
      if (typeof logger !== 'undefined' && logger.warn) {
        logger.warn('サーバー環境ではWebSocket購読は利用できません', {
          component: 'ChartDataService',
          action: 'subscribeKlineRealtime'
        });
      }
      return () => {};
      }
    } catch (error) {
      logger.error('ローソク足データの購読に失敗しました', {
        component: 'ChartDataService',
        action: 'subscribeKlineRealtime',
        error: error instanceof Error ? error.message : String(error)
      });
      return () => {};
    }
  }
  
  /**
   * すべてのチャートデータ購読を解除
   */
  unsubscribeAllKlines(): void {
    logger.info('すべてのローソク足データ購読を解除します', {
      component: 'ChartDataService',
      action: 'unsubscribeAllKlines'
    });
    
    // すべての購読を解除
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    
    // マップをクリア
    this.subscriptions.clear();
  }
  
  /**
   * シンボル変更時にキャッシュをクリア
   * @param newSymbol 新しいシンボル
   */
  clearCacheOnSymbolChange(newSymbol: string): void {
    const normalizedSymbol = normalizeSymbol(newSymbol);
    
    logger.info('シンボル変更によりキャッシュをクリアします', {
      component: 'ChartDataService',
      action: 'clearCacheOnSymbolChange',
      symbol: normalizedSymbol
    });
    
    // キャッシュからチャートデータのキャッシュを削除
    cacheService.clearByPattern(/^chart_/);
  }

  /**
   * サービス状態をリセット
   * すべての購読を解除し、内部クライアントを破棄します
   */
  reset(): void {
    this.unsubscribeAllKlines();
    this.bitgetApiClient = null;
  }
}

/**
 * タイムフレームをミリ秒に変換するヘルパー関数
 * @param timeframe タイムフレーム（例: '1m', '1h'）
 * @returns ミリ秒
 */
export function getTimeframeMilliseconds(timeframe: Timeframe): number {
  const unit = timeframe.slice(-1);
  const value = parseInt(timeframe.slice(0, -1), 10);
  
  switch (unit) {
    case 'm': // 分
      return value * 60 * 1000;
    case 'h': // 時間
      return value * 60 * 60 * 1000;
    case 'd': // 日
      return value * 24 * 60 * 60 * 1000;
    case 'w': // 週
      return value * 7 * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
}

// シングルトンインスタンス
let chartDataServiceInstance: ChartDataService | null = null;

/**
 * チャートデータサービスのシングルトンインスタンスを取得
 * @returns ChartDataServiceインスタンス
 */
export function getChartDataService(): ChartDataService {
  if (!chartDataServiceInstance) {
    chartDataServiceInstance = new ChartDataService();
  }
  return chartDataServiceInstance;
}

// テスト用にシングルトンインスタンスをリセットする関数
export function resetChartDataServiceForTesting(): void {
  if (chartDataServiceInstance) {
    chartDataServiceInstance.reset();
  }
  chartDataServiceInstance = null;
}

// シングルトンインスタンスをエクスポート
export const chartDataService = getChartDataService();
