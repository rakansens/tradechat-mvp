import { useState, useEffect, useCallback } from 'react';
import { getStoredLogs, clearStoredLogs, type StoredLog } from '@/utils/logStorage';

// ログタブで選択できるレベル
export type LogLevel = 'all' | 'error' | 'warn' | 'debug';

// 旧インターフェースとの互換のために残している型
export interface LogEntry {
  message: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  data?: any;
}

/**
 * デバッグログを管理するフック
 */
export function useLogs(activeTab: LogLevel = 'all') {
  const [logs, setLogs] = useState<StoredLog[]>([]);

  const refreshLogs = useCallback(() => {
    const stored = getStoredLogs();
    const filtered =
      activeTab === 'all'
        ? stored
        : stored.filter((log) => log.level === activeTab);
    setLogs(filtered);
  }, [activeTab]);

  const handleClearLogs = useCallback(() => {
    clearStoredLogs();
    setLogs([]);
  }, []);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  return {
    logs,
    refreshLogs,
    handleClearLogs
  };
}

export default useLogs; 