import { useDebugStore } from '@/store/useDebugStore';
import { useSymbolStore } from '@/store/useSymbolStore';
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
 */
export function useDebugStores() {
  // デバッグストアからのセレクタ
  const isDebugMode = useDebugStore(state => state.isDebugMode);
  const toggleDebugMode = useDebugStore(state => state.toggleDebugMode);
  const getActiveFetchesInfo = useDebugStore(state => state.getActiveFetchesInfo);
  const getPollingStatus = useDebugStore(state => state.getPollingStatus);
  
  // シンボルストアからのセレクタ
  const getSymbolChangeHistory = useSymbolStore(state => state.getSymbolChangeHistory);
  
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
    const symbolHistory = getSymbolChangeHistory();
    
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
  }, [isDebugMode, getActiveFetchesInfo, getPollingStatus, getSymbolChangeHistory]);
  
  return {
    // ストアの状態と操作
    isDebugMode,
    toggleDebugMode,
    
    // デバッグ情報取得関数
    refreshDebugInfo
  };
} 