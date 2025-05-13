import { useRootStore } from '@/store/rootStore';
import { selectIsDebugMode } from '@/store/debug/selectors';
import { cacheService } from '@/services/cache';
import { requestHistoryService } from '@/services/history';
import { useCallback } from 'react';

// デバッグ情報の型定義
interface DebugInfo {
  activeFetches: any[];
  pollingStatus: Record<string, any>;
  symbolHistory: any[];
  cacheStats: Record<string, any>;
  requestHistory: any[];
}

/**
 * デバッグ関連のストア参照を集約するフック
 * 
 * LogViewerコンポーネントで使用するすべてのストアセレクタとデバッグ関連の
 * サービス呼び出しを単一のインターフェースにまとめる
 * 
 * 更新: 2025-05-15 - useDebugStore → rootStoreのDebugSliceに移行
 */
export function useDebugStores() {
  // デバッグ関連のセレクター - RootStoreから取得
  const isDebugMode = useRootStore(selectIsDebugMode);
  const toggleDebugMode = useRootStore(state => state.toggleDebugMode);
  const getActiveFetchesInfo = useRootStore(state => state.getActiveFetchesInfo);
  const getPollingStatus = useRootStore(state => state.getPollingStatus);
  
  // シンボル履歴情報の取得 - rootStoreから直接取得
  const getDebugSymbolChangeHistory = useRootStore(state => state.getDebugSymbolChangeHistory);
  
  // デバッグ情報を更新する関数
  const refreshDebugInfo = useCallback((): DebugInfo => {
    if (!isDebugMode) return {
      activeFetches: [],
      pollingStatus: {},
      symbolHistory: [],
      cacheStats: {},
      requestHistory: []
    };
    
    // ストアからデバッグ情報を取得
    const activeFetches = getActiveFetchesInfo();
    const pollingStatus = getPollingStatus();
    const symbolHistory = getDebugSymbolChangeHistory();
    
    // サービスからデバッグ情報を取得
    let cacheStats: Record<string, any> = {};
    let requestHistory: any[] = [];
    
    try {
      cacheStats = cacheService.getStats();
      requestHistory = requestHistoryService.getHistory();
    } catch (e) {
      console.error('Failed to get debug info from services', e);
    }
    
    return {
      activeFetches,
      pollingStatus,
      symbolHistory,
      cacheStats,
      requestHistory
    };
  }, [isDebugMode, getActiveFetchesInfo, getPollingStatus, getDebugSymbolChangeHistory]);
  
  return {
    // ストアの状態と操作
    isDebugMode,
    toggleDebugMode,
    
    // デバッグ情報取得関数
    refreshDebugInfo
  };
} 