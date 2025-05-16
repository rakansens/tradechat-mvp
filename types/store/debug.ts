// types/store/debug.ts
// 作成: 2025-10-07 - デバッグストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/debug/state.tsの定義を統合

/**
 * このファイルはデバッグストアの型定義を提供します。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

// ログレベルの定義
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// ログエントリーの型
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  details?: any;
}

// ログフィルターの型
export interface LogFilter {
  level?: LogLevel[];
  source?: string[];
  search?: string;
  startTime?: number;
  endTime?: number;
}

// パフォーマンスメトリクスの型
export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  source: string;
  metadata?: Record<string, any>;
}

// デバッグツール設定の型
export interface DebugToolsConfig {
  enabled: boolean;
  logRetentionCount: number;
  performanceMonitoringEnabled: boolean;
  networkLoggingEnabled: boolean;
  storeMonitoringEnabled: boolean;
  verboseMode: boolean;
}

// デバッグスライスの状態インターフェース
export interface DebugState {
  // 基本デバッグモード
  isDebugMode: boolean;
  
  // 拡張デバッグ機能
  logs: LogEntry[];
  performanceMetrics: PerformanceMetric[];
  activePerformanceTrackers: Record<string, number>; // id -> startTime
  filter: LogFilter;
  config: DebugToolsConfig;
  isVisible: boolean;
}

// デバッグスライスのアクション定義
export interface DebugActions {
  // 基本アクション
  toggleDebugMode: () => void;
  
  // ログ管理
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  
  // パフォーマンストラッキング
  startPerformanceTracker: (name: string, source: string, metadata?: Record<string, any>) => string;
  endPerformanceTracker: (id: string) => void;
  
  // フィルター設定
  setFilter: (filter: Partial<LogFilter>) => void;
  
  // 設定管理
  setConfig: (config: Partial<DebugToolsConfig>) => void;
  
  // UI表示管理
  toggleVisibility: () => void;
  setVisibility: (isVisible: boolean) => void;
  
  // デバッグ情報取得
  getActiveFetchesInfo: () => any[];
  getPollingStatus: () => any;
  getDebugSymbolChangeHistory: () => any[];
  getDebugWebSocketStatus: () => any;
}

// 完全なデバッグスライスの型定義
export type DebugSlice = DebugState & DebugActions; 