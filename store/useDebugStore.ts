// store/useDebugStore.ts
// 作成: useAppStoreから分離したデバッグ情報の提供を管理するストア
// 
// このストアはデバッグ情報の提供を一元化します。
// 主な機能:
// 1. デバッグモードの管理
// 2. シンボル変更履歴の管理
// 3. ポーリング状態の管理
// 4. WebSocket状態の管理

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '../utils/logger';
import { useSymbolStore } from './useSymbolStore';
import { useOrderBookStore } from './market/useOrderBookStore';
import { useDataFetchStore } from './useDataFetchStore';
import { useWebSocketStore } from './useWebSocketStore';

// デバッグストアの状態型定義
export interface DebugState {
  // デバッグ関連の状態
  isDebugMode: boolean;
  
  // デバッグ関連のアクション
  toggleDebugMode: () => void;
  getActiveFetchesInfo: () => any[];
  getPollingStatus: () => any;
  getSymbolChangeHistory: () => any[];
  getWebSocketStatus: () => { connected: boolean; subscriptions: { orderbook: boolean; chart: boolean } };
}

// Zustandストア作成
export const useDebugStore = create<DebugState>()(
  devtools(
    (set, get) => ({
      // 初期状態 - デバッグ関連
      isDebugMode: process.env.NODE_ENV === 'development',
      
      // デバッグモードの切り替え
      toggleDebugMode: () => {
        set(state => ({ isDebugMode: !state.isDebugMode }));
      },
      
      // アクティブなフェッチリクエストの情報を取得
      getActiveFetchesInfo: () => {
        return useDataFetchStore.getState().getActiveFetchesInfo();
      },
      
      // ポーリング状態の情報を取得
      getPollingStatus: () => {
        return {
          orderbook: useOrderBookStore.getState().pollingInfo
        };
      },
      
      // シンボル変更履歴を取得
      getSymbolChangeHistory: () => {
        return useSymbolStore.getState().getSymbolChangeHistory();
      },
      
      // WebSocketの接続状態を取得
      getWebSocketStatus: () => {
        return useWebSocketStore.getState().getWebSocketStatus();
      }
    }),
    { name: 'debug-store' }
  )
);

// デフォルトエクスポート
export default useDebugStore;