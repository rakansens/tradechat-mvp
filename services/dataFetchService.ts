/**
 * dataFetchService.ts
 * WebSocketの共有データ方式に対応したデータフェッチサービス
 *
 * 更新内容:
 * - WebSocketからのデータを利用するように変更
 * - キャッシュ戦略の見直しと最適化
 * - WebSocketとRESTAPIのフォールバック機能を実装
 * - エラーハンドリングの強化
 */

import { BitgetApiClient } from './bitgetApi';
import { ExchangeType } from '../types/api';
import { OrderBookData } from '../types/market';
import { OHLCData, Timeframe } from '../types/chart';
import { logger } from '../utils/logger';
import { normalizeSymbol } from '../lib/utils';
import { socketService } from './socketService';

// シンプルなキャッシュ実装
const cache = new Map<string, { data: any, timestamp: number, source: 'websocket' | 'rest' }>();
const CACHE_TTL = 30000; // 30秒キャッシュ
const WS_CACHE_TTL = 60000; // WebSocketデータは60秒キャッシュ

// リクエスト履歴を保存する配列
const requestHistory: Array<{
  url: string;
  method: string;
  timestamp: number;
  duration: number;
  status: number;
  success: boolean;
}> = [];

export const dataFetchService = {
  /**
   * キャッシュの統計情報を取得
   */
  getCacheStats: () => {
    const stats = {
      totalEntries: cache.size,
      entries: [] as Array<{
        key: string;
        age: number;
        size: number;
      }>
    };
    
    for (const [key, value] of cache.entries()) {
      stats.entries.push({
        key,
        age: Date.now() - value.timestamp,
        size: JSON.stringify(value.data).length
      });
    }
    
    return stats;
  },
  
  /**
   * リクエスト履歴を取得
   */
  getRequestHistory: () => {
    return [...requestHistory];
  },
  
  /**
   * キャッシュからデータを取得
   */
  getFromCache: <T>(key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;
    
    // キャッシュ有効期限チェック（ソースによって有効期限を変える）
    const ttl = item.source === 'websocket' ? WS_CACHE_TTL : CACHE_TTL;
    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key);
      return null;
    }
    
    return item.data as T;
  },
  
  /**
   * キャッシュにデータを保存
   */
  setToCache: <T>(key: string, data: T, source: 'websocket' | 'rest' = 'rest'): void => {
    cache.set(key, { data, timestamp: Date.now(), source });
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
    } else {
      // 全キャッシュをクリア
      cache.clear();
    }
  },
  
  /**
   * オーダーブックデータ取得（WebSocketとRESTAPIのハイブリッド）
   */
  fetchOrderBook: async (
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OrderBookData> => {
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = dataFetchService.getFromCache<OrderBookData>(requestKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      // WebSocketが接続されているか確認
      if (socketService.isConnected()) {
        try {
          // WebSocketからデータを取得（Promise化）
          const wsData = await new Promise<OrderBookData>((resolve, reject) => {
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
              reject(new Error('WebSocketからのデータ取得がタイムアウトしました'));
            }, 5000); // 5秒でタイムアウト
            
            // 一時的なサブスクリプション
            const unsubscribe = socketService.subscribeOrderBook(
              normalizedSymbol,
              (data) => {
                clearTimeout(timeoutId);
                unsubscribe(); // 一度データを受け取ったら購読解除
                resolve(data);
              },
              exchangeType
            );
          });
          
          // WebSocketからデータを取得できた場合
          if (wsData) {
            // リクエスト履歴に追加
            requestHistory.push({
              url: `websocket/orderbook/${normalizedSymbol}`,
              method: 'WS',
              timestamp: Date.now(),
              duration: 0,
              status: 200,
              success: true
            });
            
            // 成功したらキャッシュに保存（WebSocketソース）
            if (useCache) {
              cache.set(requestKey, {
                data: wsData,
                timestamp: Date.now(),
                source: 'websocket'
              });
            }
            
            return wsData;
          }
        } catch (wsError) {
          // WebSocketエラーをログに記録（フォールバックのため例外はスローしない）
          logger.warn(`WebSocketからのオーダーブック取得に失敗、RESTAPIにフォールバック: ${wsError}`, {
            component: 'dataFetchService',
            action: 'fetchOrderBook',
            symbol: normalizedSymbol,
            error: wsError
          });
        }
      }
      
      // WebSocketが失敗した場合またはWebSocketが接続されていない場合はRESTAPIを使用
      const startTime = Date.now();
      const api = new BitgetApiClient({}, exchangeType);
      const data = await api.getOrderBook(normalizedSymbol, exchangeType);
      const endTime = Date.now();
      
      // リクエスト履歴に追加
      requestHistory.push({
        url: `bitget/orderbook/${normalizedSymbol}`,
        method: 'GET',
        timestamp: startTime,
        duration: endTime - startTime,
        status: 200,
        success: true
      });
      
      // 履歴が100件を超えたら古いものを削除
      if (requestHistory.length > 100) {
        requestHistory.shift();
      }
      
      // 成功したらキャッシュに保存（RESTソース）
      if (useCache) {
        cache.set(requestKey, {
          data,
          timestamp: Date.now(),
          source: 'rest'
        });
      }
      
      return data;
    } catch (error) {
      // エラー時もリクエスト履歴に追加
      requestHistory.push({
        url: `bitget/orderbook/${normalizedSymbol}`,
        method: 'GET',
        timestamp: Date.now(),
        duration: 0,
        status: 500,
        success: false
      });
      
      logger.error(`オーダーブック取得エラー: ${error}`, {
        component: 'dataFetchService',
        action: 'fetchOrderBook',
        symbol,
        error
      });
      throw error;
    }
  },
  
  /**
   * チャートデータ取得（WebSocketとRESTAPIのハイブリッド）
   */
  fetchChartData: async (
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> => {
    // シンボルが空の場合はエラーをスロー
    if (!symbol || symbol.trim() === '') {
      logger.error('空のシンボルでチャートデータを取得しようとしました', {
        component: 'dataFetchService',
        action: 'fetchChartData',
        timeFrame,
        exchangeType
      });
      return [];
    }
    
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
    
    logger.debug(`チャートデータ取得開始:`, {
      component: 'dataFetchService',
      action: 'fetchChartData',
      symbol: normalizedSymbol,
      timeFrame,
      exchangeType,
      useCache,
      requestKey
    });
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = dataFetchService.getFromCache<OHLCData[]>(requestKey);
      if (cachedData) {
        logger.debug(`キャッシュからデータを取得:`, {
          component: 'dataFetchService',
          action: 'fetchChartData',
          requestKey,
          dataCount: cachedData.length,
          dataSample: cachedData.slice(-3) // 最後の3件のデータをサンプルとして記録
        });
        return cachedData;
      }
    }
    
    try {
      // WebSocketが接続されているか確認
      if (socketService.isConnected()) {
        try {
          // WebSocketからデータを取得（Promise化）
          // 注意: ローソク足データは配列で返されるため、複数のデータを受け取る必要がある
          const wsData = await new Promise<OHLCData[]>((resolve, reject) => {
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
              reject(new Error('WebSocketからのデータ取得がタイムアウトしました'));
            }, 5000); // 5秒でタイムアウト
            
            // 受信したデータを格納する配列
            const receivedData: OHLCData[] = [];
            let dataCount = 0;
            
            // 一時的なサブスクリプション
            const unsubscribe = socketService.subscribeKline(
              normalizedSymbol,
              timeFrame,
              (data) => {
                receivedData.push(data);
                dataCount++;
                
                // 十分なデータが集まったら完了
                if (dataCount >= 10) { // 最低10件のデータを受信
                  clearTimeout(timeoutId);
                  unsubscribe(); // データを受け取ったら購読解除
                  resolve(receivedData);
                }
              },
              exchangeType
            );
            
            // 一定時間後にデータが少なくても返す
            setTimeout(() => {
              if (receivedData.length > 0) {
                clearTimeout(timeoutId);
                unsubscribe();
                resolve(receivedData);
              }
            }, 3000); // 3秒待機
          });
          
          // WebSocketからデータを取得できた場合
          if (wsData && wsData.length > 0) {
            // リクエスト履歴に追加
            requestHistory.push({
              url: `websocket/chart/${normalizedSymbol}/${timeFrame}`,
              method: 'WS',
              timestamp: Date.now(),
              duration: 0,
              status: 200,
              success: true
            });
            
            // 成功したらキャッシュに保存（WebSocketソース）
            if (useCache) {
              cache.set(requestKey, {
                data: wsData,
                timestamp: Date.now(),
                source: 'websocket'
              });
              
              logger.debug(`WebSocketからのデータをキャッシュに保存:`, {
                component: 'dataFetchService',
                action: 'fetchChartData',
                requestKey,
                dataCount: wsData.length,
                dataSample: wsData.slice(-3) // 最後の3件のデータをサンプルとして記録
              });
            }
            
            return wsData;
          }
        } catch (wsError) {
          // WebSocketエラーをログに記録（フォールバックのため例外はスローしない）
          logger.warn(`WebSocketからのチャートデータ取得に失敗、RESTAPIにフォールバック: ${wsError}`, {
            component: 'dataFetchService',
            action: 'fetchChartData',
            symbol: normalizedSymbol,
            timeFrame,
            error: wsError
          });
        }
      }
      
      // WebSocketが失敗した場合またはWebSocketが接続されていない場合はRESTAPIを使用
      const api = new BitgetApiClient({}, exchangeType);
      const data = await api.getHistoricalCandles(normalizedSymbol, timeFrame, 100);
      
      // リクエスト履歴に追加
      requestHistory.push({
        url: `bitget/chart/${normalizedSymbol}/${timeFrame}`,
        method: 'GET',
        timestamp: Date.now(),
        duration: 0,
        status: 200,
        success: true
      });
      
      // 成功したらキャッシュに保存（RESTソース）
      if (useCache) {
        cache.set(requestKey, {
          data,
          timestamp: Date.now(),
          source: 'rest'
        });
        
        logger.debug(`RESTAPIからのデータをキャッシュに保存:`, {
          component: 'dataFetchService',
          action: 'fetchChartData',
          requestKey,
          dataCount: data.length,
          dataSample: data.slice(-3) // 最後の3件のデータをサンプルとして記録
        });
      }
      
      return data;
    } catch (error) {
      logger.error(`チャートデータ取得エラー: ${error}`, {
        component: 'dataFetchService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        error
      });
      throw error;
    }
  },
  /**
   * シンボル変更時にキャッシュをクリア
   */
  handleSymbolChange: (newSymbol: string): void => {
    // 正規化したシンボルを使用
    const normalizedSymbol = normalizeSymbol(newSymbol);
    
    // 当該シンボルに関連するキャッシュをすべてクリア
    dataFetchService.clearCache(`chart-${normalizedSymbol}`);
    dataFetchService.clearCache(`orderbook-${normalizedSymbol}`);
    
    logger.info(`シンボル変更: ${newSymbol} のキャッシュをクリアしました`, {
      component: 'dataFetchService',
      action: 'handleSymbolChange',
      symbol: newSymbol,
      normalizedSymbol
    });
  },
  
  /**
   * 時間足変更時にキャッシュをクリア
   * タイムフレームが変更されたときに古いキャッシュが使われないようにする
   */
  handleTimeframeChange: (symbol: string, newTimeframe: Timeframe, exchangeType: ExchangeType = 'spot'): void => {
    // 正規化したシンボルを使用
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // キャッシュを終了前にすべてクリアするため、すべてのキャッシュおよびその状態を確認
    const allCacheEntries = [] as {key: string}[];
    for (const key of cache.keys()) {
      allCacheEntries.push({key});
    }
    
    // キャッシュクリア前のキャッシュ内容を詳細に記録
    const cacheContentsBeforeClear = [] as {key: string, data: any, timestamp: number, source: string}[];
    for (const [key, value] of cache.entries()) {
      if (key.startsWith(`chart-${normalizedSymbol}`)) {
        cacheContentsBeforeClear.push({
          key,
          data: value.data,
          timestamp: value.timestamp,
          source: value.source
        });
      }
    }
    logger.debug(`タイムフレーム変更前のキャッシュ内容:`, {
      component: 'dataFetchService',
      action: 'handleTimeframeChange',
      cacheContentsBeforeClear,
      newTimeframe
    });
    
    // 全キャッシュエントリ記録
    logger.debug(`キャッシュクリア前のキャッシュエントリ:`, {
      component: 'dataFetchService',
      action: 'handleTimeframeChange',
      allCacheEntries
    });
    
    // 1. 厳密なキャッシュキーをクリア - タイムフレームと取引種別を含む
    const exactCacheKey = `chart-${normalizedSymbol}-${newTimeframe}-${exchangeType}`;
    dataFetchService.clearCache(exactCacheKey);
    
    // 2. このシンボルのすべてのタイムフレームをクリア
    const symbolBaseKey = `chart-${normalizedSymbol}`;
    
    // このシンボルに関連するキャッシュエントリを手動でクリア
    for (const key of cache.keys()) {
      // シンボルに関連するすべてのキャッシュを削除
      if (key.startsWith(symbolBaseKey)) {
        cache.delete(key);
        logger.debug(`キャッシュキー削除: ${key}`, {
          component: 'dataFetchService',
          action: 'handleTimeframeChange'
        });
      }
    }
    
    // 3. 事後チェック: 該当シンボルのキャッシュがクリアされたか確認
    const remainingCacheKeys = [] as string[];
    for (const key of cache.keys()) {
      if (key.startsWith(symbolBaseKey)) {
        remainingCacheKeys.push(key);
      }
    }
    
    // キャッシュクリア後のキャッシュ内容を詳細に記録
    const cacheContentsAfterClear = [] as {key: string, data: any, timestamp: number, source: string}[];
    for (const [key, value] of cache.entries()) {
      if (key.startsWith(`chart-${normalizedSymbol}`)) {
        cacheContentsAfterClear.push({
          key,
          data: value.data,
          timestamp: value.timestamp,
          source: value.source
        });
      }
    }
    logger.debug(`タイムフレーム変更後のキャッシュ内容:`, {
      component: 'dataFetchService',
      action: 'handleTimeframeChange',
      cacheContentsAfterClear,
      newTimeframe
    });
    
    logger.info(`時間足変更: ${symbol} ${newTimeframe} (${exchangeType}) のキャッシュをクリアしました`, {
      component: 'dataFetchService',
      action: 'handleTimeframeChange',
      symbol,
      normalizedSymbol,
      timeframe: newTimeframe,
      exchangeType,
      clearedExactKey: exactCacheKey,
      clearedSymbolBaseKey: symbolBaseKey,
      remainingCacheKeys: remainingCacheKeys // クリア後に残っているキャッシュがあれば表示
    });
  },
  
  /**
   * WebSocketを使用してオーダーブックデータをリアルタイム購読
   *
   * @param symbol シンボル
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeOrderBookRealtime: (
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void => {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // WebSocketが接続されているか確認
    if (!socketService.isConnected()) {
      // WebSocketが接続されていない場合は接続を試みる
      socketService.initializeMarketSocket();
    }
    
    // WebSocketを使用してオーダーブックを購読
    const unsubscribe = socketService.subscribeOrderBook(
      normalizedSymbol,
      (data) => {
        // データをキャッシュに保存
        const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
        cache.set(requestKey, {
          data,
          timestamp: Date.now(),
          source: 'websocket'
        });
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    return unsubscribe;
  },
  
  /**
   * WebSocketを使用してローソク足データをリアルタイム購読
   *
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeKlineRealtime: (
    symbol: string,
    timeFrame: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void => {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // WebSocketが接続されているか確認
    if (!socketService.isConnected()) {
      // WebSocketが接続されていない場合は接続を試みる
      socketService.initializeMarketSocket();
    }
    
    // WebSocketを使用してローソク足データを購読
    const unsubscribe = socketService.subscribeKline(
      normalizedSymbol,
      timeFrame,
      (data) => {
        // データをキャッシュに保存（既存のキャッシュがあれば更新）
        const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
        const cachedData = dataFetchService.getFromCache<OHLCData[]>(requestKey);
        
        if (cachedData) {
          // 既存のデータがある場合は更新
          const updatedData = [...cachedData];
          
          // 同じ時間のデータがあれば更新、なければ追加
          const existingIndex = updatedData.findIndex(item => item.time === data.time);
          if (existingIndex !== -1) {
            updatedData[existingIndex] = data;
          } else {
            updatedData.push(data);
            
            // 時間順にソート
            updatedData.sort((a, b) => a.time - b.time);
          }
          
          // キャッシュを更新
          cache.set(requestKey, {
            data: updatedData,
            timestamp: Date.now(),
            source: 'websocket'
          });
        } else {
          // 既存のデータがない場合は新規作成
          cache.set(requestKey, {
            data: [data],
            timestamp: Date.now(),
            source: 'websocket'
          });
        }
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    return unsubscribe;
  }
};

export default dataFetchService;