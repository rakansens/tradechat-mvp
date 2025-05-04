// utils/logStorage.ts
// 作成: ログの永続化機能の実装
// このファイルはログをローカルストレージに保存・取得する機能を提供します

// LogLevelをlogger.tsと同じ定義で直接定義（循環依存を避けるため）
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// LogLevelの定数を定義
export const LOG_LEVEL = {
  ERROR: 'error' as LogLevel,
  WARN: 'warn' as LogLevel,
  INFO: 'info' as LogLevel,
  DEBUG: 'debug' as LogLevel
};

/**
 * 保存されるログのインターフェース
 */
export interface StoredLog {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: string;
  context?: any;
}

// ローカルストレージのキー
const LOG_STORAGE_KEY = 'tradechat_logs';
// 保存する最大ログ数
const MAX_LOGS = 100;

/**
 * ログをローカルストレージに保存する
 * @param level ログレベル
 * @param message ログメッセージ
 * @param error エラーオブジェクト（オプション）
 * @param context コンテキスト情報（オプション）
 */
export function saveLogToStorage(
  level: LogLevel,
  message: string,
  error?: Error | null,
  context?: any
): void {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    // エラーレベルと警告レベルのログのみ保存
    if (level !== 'error' && level !== 'warn') {
      return;
    }

    const logs: StoredLog[] = JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
    
    // エラーオブジェクトを文字列化（循環参照を避けるため特別な処理）
    let errorString: string | undefined = undefined;
    if (error) {
      try {
        errorString = JSON.stringify({
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      } catch (e) {
        errorString = `Error serializing error: ${e}`;
      }
    }
    
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      error: errorString,
      context
    });
    
    // 最大数を超えた場合は古いものから削除
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }
    
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    // ストレージへの保存に失敗した場合はコンソールに出力
    console.error('Failed to save log to storage:', e);
  }
}

/**
 * ローカルストレージから保存されたログを取得する
 * @returns 保存されたログの配列
 */
export function getStoredLogs(): StoredLog[] {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(LOG_STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Failed to retrieve logs from storage:', e);
    return [];
  }
}

/**
 * ローカルストレージから保存されたログをクリアする
 */
export function clearStoredLogs(): void {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(LOG_STORAGE_KEY);
}

/**
 * 特定のレベルのログのみを取得する
 * @param level 取得するログのレベル
 * @returns 指定されたレベルのログの配列
 */
export function getStoredLogsByLevel(level: LogLevel): StoredLog[] {
  const logs = getStoredLogs();
  return logs.filter(log => log.level === level);
}

/**
 * 指定された期間内のログを取得する
 * @param startDate 開始日時
 * @param endDate 終了日時
 * @returns 指定された期間内のログの配列
 */
export function getStoredLogsByDateRange(startDate: Date, endDate: Date): StoredLog[] {
  const logs = getStoredLogs();
  return logs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}
