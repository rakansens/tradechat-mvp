import { useState } from 'react';

export interface LogEntry {
  message: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  data?: any;
}

/**
 * デバッグログを管理するフック
 */
export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const addLog = (entry: Omit<LogEntry, 'timestamp'>) => {
    setLogs(prev => [
      ...prev,
      {
        ...entry,
        timestamp: Date.now()
      }
    ]);
  };
  
  const clearLogs = () => {
    setLogs([]);
  };
  
  return {
    logs,
    addLog,
    clearLogs
  };
}

export default useLogs; 