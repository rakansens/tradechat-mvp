import { useState, useEffect, useCallback } from 'react';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';
import { useDebugStore } from '@/store/useDebugStore';
import { useSymbolStore } from '@/store/useSymbolStore';
import { cacheService } from '@/services/cache';
import { requestHistoryService } from '@/services/history';

export function useDebugPanel() {
  // ログ関連の状態
  const [logs, setLogs] = useState<StoredLog[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'error' | 'warn' | 'debug'>('all');
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  
  // デバッグ情報の状態
  const [activeFetches, setActiveFetches] = useState<any[]>([]);
  const [pollingStatus, setPollingStatus] = useState<any>({});
  const [symbolHistory, setSymbolHistory] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>({});
  const [requestHistory, setRequestHistory] = useState<any[]>([]);
  
  // ストアからデバッグ関連の状態と関数を取得
  const isDebugMode = useDebugStore(state => state.isDebugMode);
  const toggleDebugMode = useDebugStore(state => state.toggleDebugMode);
  const getActiveFetchesInfo = useDebugStore(state => state.getActiveFetchesInfo);
  const getPollingStatus = useDebugStore(state => state.getPollingStatus);
  const getSymbolChangeHistory = useSymbolStore(state => state.getSymbolChangeHistory);
  
  // ログを取得して状態を更新
  const refreshLogs = useCallback(() => {
    const allLogs = getStoredLogs();
    
    // タブに応じてフィルタリング
    let filteredLogs = allLogs;
    if (activeTab === 'error') {
      filteredLogs = allLogs.filter(log => log.level === 'error');
    } else if (activeTab === 'warn') {
      filteredLogs = allLogs.filter(log => log.level === 'warn');
    }
    
    setLogs(filteredLogs);
  }, [activeTab]);
  
  // デバッグ情報を更新する関数
  const refreshDebugInfo = useCallback(() => {
    if (isDebugMode) {
      // AppStoreからデバッグ情報を取得
      setActiveFetches(getActiveFetchesInfo());
      setPollingStatus(getPollingStatus());
      setSymbolHistory(getSymbolChangeHistory());
      
      // 新しいサービスからデバッグ情報を取得
      try {
        setCacheStats(cacheService.getStats());
        setRequestHistory(requestHistoryService.getHistory());
      } catch (e) {
        console.error('Failed to get debug info from services', e);
      }
    }
  }, [isDebugMode, getActiveFetchesInfo, getPollingStatus, getSymbolChangeHistory]);
  
  // ログをクリア
  const handleClearLogs = useCallback(() => {
    clearStoredLogs();
    setLogs([]);
  }, []);
  
  // 定期的な更新を設定
  useEffect(() => {
    if (isDebugMode) {
      const intervalId = setInterval(() => {
        refreshLogs();
        refreshDebugInfo();
      }, 2000); // 2秒ごとに更新
      
      setRefreshInterval(intervalId as unknown as number);
      
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isDebugMode, refreshDebugInfo, refreshLogs, refreshInterval]);
  
  return {
    logs,
    activeTab,
    setActiveTab,
    activeFetches,
    pollingStatus,
    symbolHistory,
    cacheStats,
    requestHistory,
    isDebugMode,
    toggleDebugMode,
    refreshLogs,
    refreshDebugInfo,
    handleClearLogs
  };
} 