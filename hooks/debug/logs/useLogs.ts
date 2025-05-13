import { useState, useEffect } from 'react';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';

export type LogLevel = 'all' | 'error' | 'warn' | 'debug';

/**
 * ログ表示と管理に関するフック
 * 
 * 指定されたレベルでログをフィルタリングし、表示/クリア機能を提供
 * 
 * 更新: リファクタリングによりhooks/debug/logs/に移動
 */
export function useLogs(activeTab: LogLevel = 'all') {
  const [logs, setLogs] = useState<StoredLog[]>([]);
  
  // ログを取得して状態を更新
  const refreshLogs = () => {
    const allLogs = getStoredLogs();
    
    // タブに応じてフィルタリング
    let filteredLogs = allLogs;
    if (activeTab === 'error') {
      filteredLogs = allLogs.filter(log => log.level === 'error');
    } else if (activeTab === 'warn') {
      filteredLogs = allLogs.filter(log => log.level === 'warn');
    } else if (activeTab === 'debug') {
      filteredLogs = allLogs.filter(log => log.level === 'debug');
    }
    
    setLogs(filteredLogs);
  };
  
  // ログをクリア
  const handleClearLogs = () => {
    clearStoredLogs();
    setLogs([]);
  };
  
  // タブが変更されたときにログを更新
  useEffect(() => {
    refreshLogs();
  }, [activeTab]);
  
  return {
    logs,
    refreshLogs,
    handleClearLogs
  };
} 