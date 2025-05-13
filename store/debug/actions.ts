// store/debug/actions.ts
// 作成: 2025-05-15 - デバッグスライスのアクション実装
// 更新: 2025-05-15 - 重複するメソッド名を修正し、アクションを明確に分けました
// 更新: 2025-05-30 - useDataFetchStoreを削除し、useRootStoreを使用するように変更

import type { DebugSliceState } from './state';
import { useSocketStatus } from '@/store/socket/selectors';
import { useRootStore } from '@/store/rootStore';
import { useOrderBookStore } from '@/store/market/useOrderBookStore';

/**
 * デバッグスライスのアクション定義
 */
export interface DebugSliceActions {
  // デバッグモードの切り替え
  toggleDebugMode: () => void;
  
  // デバッグ情報取得
  getActiveFetchesInfo: () => any[];
  getPollingStatus: () => Record<string, any>;
  getDebugSymbolChangeHistory: () => any[]; // メソッド名変更：getSymbolChangeHistory→getDebugSymbolChangeHistory
  getDebugWebSocketStatus: () => Record<string, any>; // メソッド名変更：getWebSocketStatus→getDebugWebSocketStatus
}

/**
 * デバッグスライスのアクション作成関数
 */
export const createDebugActions = (
  set: (fn: (state: DebugSliceState) => void) => void,
  get: () => DebugSliceState
): DebugSliceActions => ({
  
  // デバッグモードの切り替え
  toggleDebugMode: () => {
    set((state) => {
      state.isDebugMode = !state.isDebugMode;
    });
  },
  
  // アクティブなフェッチ情報を取得
  getActiveFetchesInfo: () => {
    try {
      // DataFetchSliceを使用して情報を取得
      return useRootStore.getState().getActiveFetchesInfo();
    } catch (error) {
      console.error('Failed to get active fetches info:', error);
      return [];
    }
  },
  
  // ポーリング状態を取得
  getPollingStatus: () => {
    try {
      // OrderBookStoreからポーリング情報を取得
      return useOrderBookStore.getState().pollingInfo || {};
    } catch (error) {
      console.error('Failed to get polling status:', error);
      return {};
    }
  },
  
  // シンボル変更履歴を取得
  getDebugSymbolChangeHistory: () => {
    try {
      // RootStoreからシンボル変更履歴を取得
      return useRootStore.getState().getSymbolChangeHistory();
    } catch (error) {
      console.error('Failed to get symbol change history:', error);
      return [];
    }
  },
  
  // WebSocket状態を取得
  getDebugWebSocketStatus: () => {
    try {
      // SocketSliceのセレクターを使用
      return useSocketStatus();
    } catch (error) {
      console.error('Failed to get WebSocket status:', error);
      return {};
    }
  }
}); 