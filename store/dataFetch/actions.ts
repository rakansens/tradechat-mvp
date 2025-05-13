// store/dataFetch/actions.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴うアクション定義
// 役割: DataFetchスライスのアクション（状態更新関数）を提供する

import { logger } from '@/utils/common';
import { ActiveFetch, DataFetchSliceState } from './state';

export interface DataFetchSliceActions {
  // データフェッチ関連のアクション
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => void;
  cancelAllFetches: () => void;
  addFetch: (fetch: Omit<ActiveFetch, 'timestamp'>) => void;
  removeFetch: (type: 'orderbook' | 'chart' | 'trades', symbol: string) => void;
  
  // デバッグ関連のアクション
  getActiveFetchesInfo: () => (ActiveFetch & { duration: number })[];
}

export const createDataFetchActions = (
  set: (fn: (state: DataFetchSliceState) => void) => void,
  get: () => DataFetchSliceState
): DataFetchSliceActions => ({
  // 特定タイプのデータ取得をキャンセル
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => {
    const activeFetches = get().activeFetches;
    
    // キャンセル対象のフェッチを特定
    const fetchesToCancel = symbol
      ? activeFetches.filter(fetch => fetch.type === type && fetch.symbol === symbol)
      : activeFetches.filter(fetch => fetch.type === type);
    
    // 各フェッチをキャンセル
    fetchesToCancel.forEach(fetch => {
      logger.info(`Cancelling ${fetch.type} fetch for ${fetch.symbol}`, {
        component: 'DataFetchSlice',
        action: 'cancelFetch'
      });
      fetch.abortController.abort();
    });
    
    // アクティブフェッチリストから削除
    set(state => {
      state.activeFetches = state.activeFetches.filter(fetch => 
        !fetchesToCancel.some(f => f.type === fetch.type && f.symbol === fetch.symbol)
      );
    });
  },
  
  // すべてのデータ取得をキャンセル
  cancelAllFetches: () => {
    const activeFetches = get().activeFetches;
    
    // 各フェッチをキャンセル
    activeFetches.forEach(fetch => {
      logger.info(`Cancelling all fetches: ${fetch.type} for ${fetch.symbol}`, {
        component: 'DataFetchSlice',
        action: 'cancelAllFetches'
      });
      fetch.abortController.abort();
    });
    
    // アクティブフェッチリストをクリア
    set(state => {
      state.activeFetches = [];
    });
  },
  
  // フェッチを追加
  addFetch: (fetch: Omit<ActiveFetch, 'timestamp'>) => {
    const newFetch: ActiveFetch = {
      ...fetch,
      timestamp: Date.now()
    };
    
    // 同じタイプと銘柄の既存のフェッチをキャンセル
    // まず現在のアクティブフェッチを取得
    const activeFetches = get().activeFetches;
    
    // キャンセル対象のフェッチを特定
    const fetchesToCancel = activeFetches.filter(
      existingFetch => existingFetch.type === fetch.type && existingFetch.symbol === fetch.symbol
    );
    
    // 各フェッチをキャンセル
    fetchesToCancel.forEach(fetchToCancel => {
      logger.info(`Cancelling existing ${fetchToCancel.type} fetch for ${fetchToCancel.symbol} before adding new fetch`, {
        component: 'DataFetchSlice',
        action: 'addFetch.cancelExisting'
      });
      fetchToCancel.abortController.abort();
    });
    
    // 新しいフェッチを追加（既存の同タイプ・同シンボルのフェッチを除去した後）
    set(state => {
      state.activeFetches = [
        ...state.activeFetches.filter(
          existingFetch => !(existingFetch.type === fetch.type && existingFetch.symbol === fetch.symbol)
        ),
        newFetch
      ];
    });
    
    logger.info(`Added ${fetch.type} fetch for ${fetch.symbol}`, {
      component: 'DataFetchSlice',
      action: 'addFetch'
    });
  },
  
  // フェッチを削除
  removeFetch: (type: 'orderbook' | 'chart' | 'trades', symbol: string) => {
    set(state => {
      state.activeFetches = state.activeFetches.filter(
        fetch => !(fetch.type === type && fetch.symbol === symbol)
      );
    });
    
    logger.info(`Removed ${type} fetch for ${symbol}`, {
      component: 'DataFetchSlice',
      action: 'removeFetch'
    });
  },
  
  // アクティブなフェッチリクエストの情報を取得
  getActiveFetchesInfo: () => {
    const activeFetches = get().activeFetches;
    const now = Date.now();
    
    // 実行時間を計算して返す
    return activeFetches.map(fetch => ({
      ...fetch,
      duration: now - fetch.timestamp
    }));
  }
}); 