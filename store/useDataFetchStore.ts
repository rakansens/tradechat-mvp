// store/useDataFetchStore.ts
// 作成: useAppStoreから分離したデータフェッチの制御を管理するストア
// 
// このストアはデータフェッチの制御を一元化します。
// 主な機能:
// 1. アクティブなフェッチリクエストの管理
// 2. フェッチのキャンセル機能
// 3. フェッチ履歴の管理

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';

// アクティブデータ取得の型定義
export interface ActiveFetch {
  symbol: string;
  type: 'orderbook' | 'chart' | 'trades';
  exchangeType: ExchangeType;
  abortController: AbortController;
  timestamp: number;
  duration?: number; // 実行時間（ミリ秒）
}

// データフェッチストアの状態型定義
export interface DataFetchState {
  // データフェッチ制御
  activeFetches: ActiveFetch[];
  
  // データフェッチ関連のアクション
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => void;
  cancelAllFetches: () => void;
  addFetch: (fetch: Omit<ActiveFetch, 'timestamp'>) => void;
  removeFetch: (type: 'orderbook' | 'chart' | 'trades', symbol: string) => void;
  
  // デバッグ関連のアクション
  getActiveFetchesInfo: () => (ActiveFetch & { duration: number })[];
}

// Zustandストア作成
export const useDataFetchStore = create<DataFetchState>()(
  devtools(
    (set, get) => ({
      // 初期状態 - データフェッチ制御
      activeFetches: [],
      
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
            component: 'useDataFetchStore',
            action: 'cancelFetch'
          });
          fetch.abortController.abort();
        });
        
        // アクティブフェッチリストから削除
        set(state => ({
          activeFetches: state.activeFetches.filter(fetch => 
            !fetchesToCancel.some(f => f.type === fetch.type && f.symbol === fetch.symbol)
          )
        }));
      },
      
      // すべてのデータ取得をキャンセル
      cancelAllFetches: () => {
        const activeFetches = get().activeFetches;
        
        // 各フェッチをキャンセル
        activeFetches.forEach(fetch => {
          logger.info(`Cancelling all fetches: ${fetch.type} for ${fetch.symbol}`, {
            component: 'useDataFetchStore',
            action: 'cancelAllFetches'
          });
          fetch.abortController.abort();
        });
        
        // アクティブフェッチリストをクリア
        set({ activeFetches: [] });
      },
      
      // フェッチを追加
      addFetch: (fetch: Omit<ActiveFetch, 'timestamp'>) => {
        const newFetch: ActiveFetch = {
          ...fetch,
          timestamp: Date.now()
        };
        
        // 同じタイプと銘柄の既存のフェッチをキャンセル
        get().cancelFetch(fetch.type, fetch.symbol);
        
        // 新しいフェッチを追加
        set(state => ({
          activeFetches: [...state.activeFetches, newFetch]
        }));
        
        logger.info(`Added ${fetch.type} fetch for ${fetch.symbol}`, {
          component: 'useDataFetchStore',
          action: 'addFetch'
        });
      },
      
      // フェッチを削除
      removeFetch: (type: 'orderbook' | 'chart' | 'trades', symbol: string) => {
        set(state => ({
          activeFetches: state.activeFetches.filter(
            fetch => !(fetch.type === type && fetch.symbol === symbol)
          )
        }));
        
        logger.info(`Removed ${type} fetch for ${symbol}`, {
          component: 'useDataFetchStore',
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
    }),
    { name: 'data-fetch-store' }
  )
);

// デフォルトエクスポート
export default useDataFetchStore;