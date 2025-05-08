/**
 * dataFetchService.ts
 * 最小限の実装を提供して、エラーを回避する
 * 更新: デバッグ機能のためのメソッドを追加
 */

import { BitgetApiClient } from './bitgetApi';
import { ExchangeType } from '../types/api';
import { OrderBookData } from '../types/market';
import { OHLCData, Timeframe } from '../types/chart';
import { logger } from '../utils/logger';
import { normalizeSymbol } from '../lib/utils';

// シンプルなキャッシュ実装
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30000; // 30秒キャッシュ

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
    
    // キャッシュ有効期限チェック
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    return item.data as T;
  },
  
  /**
   * キャッシュにデータを保存
   */
  setToCache: <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
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
   * オーダーブックデータ取得
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
      
      // 成功したらキャッシュに保存
      if (useCache) {
        dataFetchService.setToCache(requestKey, data);
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
   * チャートデータ取得
   */
  fetchChartData: async (
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> => {
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = dataFetchService.getFromCache<OHLCData[]>(requestKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      const api = new BitgetApiClient({}, exchangeType);
      const data = await api.getHistoricalCandles(normalizedSymbol, timeFrame, 100);
      
      // 成功したらキャッシュに保存
      if (useCache) {
        dataFetchService.setToCache(requestKey, data);
      }
      
      return data;
    } catch (error) {
      logger.error(`エラー: ${error}`, {
        component: 'dataFetchService',
        action: 'fetchChartData',
        error
      });
      throw error;
    }
  },
  
  /**
   * シンボル変更時にキャッシュをクリア
   */
  handleSymbolChange: (newSymbol: string): void => {
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(newSymbol);
    
    // 古いシンボルに関連するキャッシュをすべてクリア
    for (const key of cache.keys()) {
      // キーがシンボルを含む形式かチェック
      if (key.includes('-')) {
        const parts = key.split('-');
        // 新しいシンボルに関連するキャッシュ以外をすべてクリア
        if (!key.includes(`-${normalizedSymbol}-`) && !key.includes(`-${newSymbol}-`)) {
          cache.delete(key);
        }
      }
    }
  }
};

export default dataFetchService;