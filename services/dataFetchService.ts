/**
 * dataFetchService.ts
 * 複数コンポーネント間でのAPI呼び出しを最適化するための共通サービス
 * - 同一リクエストの重複排除
 * - キャッシュ機能
 * - AbortControllerサポート
 * - シンボル正規化処理の強化
 * - シンボル変更時のキャッシュ管理改善
 * - デバッグ機能の追加（アクティブなリクエスト可視化など）
 */

import { BitgetApiClient } from './bitgetApi';
import { ExchangeType } from '../types/api';
import { OrderBookData } from '../types/market';
import { OHLCData, Timeframe } from '../types/chart';
import { logger } from '../utils/logger';

// 進行中のリクエストを追跡
const pendingRequests = new Map<string, Promise<any>>();

// リクエスト統計情報
interface RequestStats {
  key: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'completed' | 'error' | 'aborted';
  duration?: number;
  error?: any;
}

// 最近のリクエスト履歴（デバッグ用）
const requestHistory: RequestStats[] = [];
const MAX_HISTORY_SIZE = 50; // 最大50件の履歴を保持

// シンプルなキャッシュ実装
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30秒キャッシュ

// 開発モードかどうか
const isDevelopment = process.env.NODE_ENV === 'development';

// リクエスト統計を追加
const addRequestStat = (key: string): RequestStats => {
  const stat: RequestStats = {
    key,
    startTime: Date.now(),
    status: 'pending'
  };
  
  // 履歴が最大サイズを超えたら古いものを削除
  if (requestHistory.length >= MAX_HISTORY_SIZE) {
    requestHistory.shift();
  }
  
  requestHistory.push(stat);
  return stat;
};

// リクエスト統計を更新
const updateRequestStat = (stat: RequestStats, status: 'completed' | 'error' | 'aborted', error?: any) => {
  stat.status = status;
  stat.endTime = Date.now();
  stat.duration = stat.endTime - stat.startTime;
  
  if (error) {
    stat.error = error;
  }
};

export const dataFetchService = {
  /**
   * キャッシュからデータを取得
   */
  getFromCache: <T>(key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    // キャッシュ有効期限チェック
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    logger.info(`Cache hit for ${key}`, {
      component: 'dataFetchService',
      action: 'getFromCache'
    });
    
    return item.data as T;
  },
  
  /**
   * キャッシュにデータを保存
   */
  setToCache: <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
    
    logger.info(`Cached data for ${key}`, {
      component: 'dataFetchService',
      action: 'setToCache'
    });
  },
  
  /**
   * キャッシュをクリア
   */
  clearCache: (keyPrefix?: string): void => {
    if (keyPrefix) {
      // 特定のプレフィックスを持つキーのみ削除
      for (const key of cache.keys()) {
        if (key.startsWith(keyPrefix)) {
          cache.delete(key);
        }
      }
      logger.info(`Cleared cache with prefix: ${keyPrefix}`, {
        component: 'dataFetchService',
        action: 'clearCache'
      });
    } else {
      // 全キャッシュをクリア
      cache.clear();
      logger.info('Cleared all cache', {
        component: 'dataFetchService',
        action: 'clearCache'
      });
    }
  },
  
  /**
   * アクティブなリクエストの情報を取得（デバッグ用）
   */
  getActiveFetchRequests: (): { key: string, duration: number }[] => {
    const now = Date.now();
    return Array.from(pendingRequests.keys()).map(key => {
      // 対応する統計情報を検索
      const stat = requestHistory.find(s => s.key === key && s.status === 'pending');
      const startTime = stat ? stat.startTime : now;
      
      return {
        key,
        duration: now - startTime
      };
    });
  },
  
  /**
   * リクエスト履歴を取得（デバッグ用）
   */
  getRequestHistory: (): RequestStats[] => {
    return [...requestHistory];
  },
  
  /**
   * キャッシュ統計情報を取得（デバッグ用）
   */
  getCacheStats: () => {
    const now = Date.now();
    const stats = Array.from(cache.entries()).map(([key, { timestamp }]) => {
      const age = now - timestamp;
      const isExpired = age > CACHE_TTL;
      
      return {
        key,
        age,
        isExpired,
        expiresIn: Math.max(0, CACHE_TTL - age)
      };
    });
    
    return {
      totalEntries: cache.size,
      entries: stats
    };
  },
  
  /**
   * オーダーブックデータ取得
   * - 同一リクエストの重複を防止
   * - キャッシュ機能
   * - AbortControllerサポート
   */
  fetchOrderBook: async (
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OrderBookData> => {
    // シンボルを正規化（スラッシュを削除）
    const normalizedSymbol = symbol.replace('/', '');
    
    const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = dataFetchService.getFromCache<OrderBookData>(requestKey);
      if (cachedData) {
        logger.info(`Cache hit for ${requestKey} (original symbol: ${symbol})`, {
          component: 'dataFetchService',
          action: 'fetchOrderBook'
        });
        return cachedData;
      }
    }
    
    // 同じリクエストが進行中なら再利用
    if (pendingRequests.has(requestKey)) {
      logger.info(`Reusing pending request for ${requestKey} (original symbol: ${symbol})`, {
        component: 'dataFetchService',
        action: 'fetchOrderBook'
      });
      return pendingRequests.get(requestKey)!;
    }
    
    logger.info(`Fetching order book for ${normalizedSymbol} (original: ${symbol}, type: ${exchangeType})`, {
      component: 'dataFetchService',
      action: 'fetchOrderBook'
    });
    
    // リクエスト統計を追加
    const requestStat = isDevelopment ? addRequestStat(requestKey) : null;
    
    const api = new BitgetApiClient({}, exchangeType);
    const requestPromise = api.getOrderBook(normalizedSymbol, exchangeType)
      .then(data => {
        // 成功したらキャッシュに保存
        if (useCache) {
          dataFetchService.setToCache(requestKey, data);
        }
        
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'completed');
        }
        
        return data;
      })
      .catch(error => {
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'error', error);
        }
        throw error;
      })
      .finally(() => {
        // リクエスト完了後にpendingRequestsから削除
        pendingRequests.delete(requestKey);
      });
    
    // AbortSignalがあれば監視
    if (signal) {
      signal.addEventListener('abort', () => {
        pendingRequests.delete(requestKey);
        
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'aborted');
        }
        
        logger.info(`Request aborted for ${requestKey}`, {
          component: 'dataFetchService',
          action: 'fetchOrderBook'
        });
      });
    }
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },
  
  /**
   * チャートデータ取得
   * - 同一リクエストの重複を防止
   * - キャッシュ機能
   * - AbortControllerサポート
   */
  fetchChartData: async (
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> => {
    // シンボルを正規化（スラッシュを削除）
    const normalizedSymbol = symbol.replace('/', '');
    
    const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = dataFetchService.getFromCache<OHLCData[]>(requestKey);
      if (cachedData) {
        logger.info(`Cache hit for ${requestKey} (original symbol: ${symbol})`, {
          component: 'dataFetchService',
          action: 'fetchChartData'
        });
        return cachedData;
      }
    }
    
    // 同じリクエストが進行中なら再利用
    if (pendingRequests.has(requestKey)) {
      logger.info(`Reusing pending request for ${requestKey} (original symbol: ${symbol})`, {
        component: 'dataFetchService',
        action: 'fetchChartData'
      });
      return pendingRequests.get(requestKey)!;
    }
    
    logger.info(`Fetching chart data for ${normalizedSymbol} (original: ${symbol}) ${timeFrame} (${exchangeType})`, {
      component: 'dataFetchService',
      action: 'fetchChartData'
    });
    
    // リクエスト統計を追加
    const requestStat = isDevelopment ? addRequestStat(requestKey) : null;
    
    const api = new BitgetApiClient({}, exchangeType);
    // BitgetApiClientのメソッドを正しく呼び出す（正規化したシンボルを使用）
    const requestPromise = api.getHistoricalCandles(normalizedSymbol, timeFrame, 100)
      .then((data: OHLCData[]) => {
        // 成功したらキャッシュに保存
        if (useCache) {
          dataFetchService.setToCache(requestKey, data);
        }
        
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'completed');
        }
        
        return data;
      })
      .catch(error => {
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'error', error);
        }
        throw error;
      })
      .finally(() => {
        // リクエスト完了後にpendingRequestsから削除
        pendingRequests.delete(requestKey);
      });
    
    // AbortSignalがあれば監視
    if (signal) {
      signal.addEventListener('abort', () => {
        pendingRequests.delete(requestKey);
        
        // リクエスト統計を更新
        if (isDevelopment && requestStat) {
          updateRequestStat(requestStat, 'aborted');
        }
        
        logger.info(`Request aborted for ${requestKey}`, {
          component: 'dataFetchService',
          action: 'fetchChartData'
        });
      });
    }
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  },
  
  /**
   * シンボル変更時にキャッシュをクリアし、進行中のリクエストをキャンセル
   */
  handleSymbolChange: (newSymbol: string): void => {
    // シンボルの正規化（BNBUSDTとBNB/USDTを同じように扱う）
    const normalizedSymbol = newSymbol.replace('/', '');
    
    console.log(`dataFetchService: handleSymbolChange called with ${newSymbol} (normalized: ${normalizedSymbol})`);
    
    logger.info(`Symbol changed to ${newSymbol} (normalized: ${normalizedSymbol}), clearing symbol-specific cache`, {
      component: 'dataFetchService',
      action: 'handleSymbolChange'
    });
    
    // 古いシンボルに関連するキャッシュをすべてクリア
    // 以前の実装では、現在のシンボルと異なるキャッシュのみをクリアしていたが、
    // これだと新しいシンボルに関連するキャッシュが残ってしまう可能性がある
    let clearedCount = 0;
    
    // シンボル固有のキャッシュをクリア
    for (const key of cache.keys()) {
      // キーがシンボルを含む形式かチェック
      if (key.includes('-')) {
        const parts = key.split('-');
        // chart-BTCUSDT-1d-spot や orderbook-BTCUSDT-spot のような形式を想定
        if (parts.length >= 2) {
          // 新しいシンボルに関連するキャッシュ以外をすべてクリア
          // 正規化したシンボルと元のシンボルの両方をチェック
          if (!key.includes(`-${normalizedSymbol}-`) && !key.includes(`-${newSymbol}-`)) {
            logger.info(`Clearing cache for ${key}`, {
              component: 'dataFetchService',
              action: 'handleSymbolChange',
              newSymbol: normalizedSymbol
            });
            cache.delete(key);
            clearedCount++;
          }
        }
      }
    }
    
    console.log(`dataFetchService: Cleared ${clearedCount} cache entries for symbol change to ${normalizedSymbol}`);
    
    // 進行中のリクエストをキャンセル
    let cancelledCount = 0;
    
    for (const key of pendingRequests.keys()) {
      // 新しいシンボルに関連するリクエスト以外をすべてキャンセル
      if (!key.includes(`-${normalizedSymbol}-`) && !key.includes(`-${newSymbol}-`)) {
        logger.info(`Cancelling pending request for ${key}`, {
          component: 'dataFetchService',
          action: 'handleSymbolChange',
          newSymbol: normalizedSymbol
        });
        pendingRequests.delete(key);
        cancelledCount++;
      }
    }
    
    console.log(`dataFetchService: Cancelled ${cancelledCount} pending requests for symbol change to ${normalizedSymbol}`);
  }
};

export default dataFetchService;
