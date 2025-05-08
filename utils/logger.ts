/**
 * utils/logger.ts
 * アプリケーション全体で使用するロガーユーティリティ
 */

// ログレベルの定義
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// 現在のログレベル（環境変数から取得、デフォルトはINFO）
const currentLogLevel = process.env.LOG_LEVEL 
  ? parseInt(process.env.LOG_LEVEL, 10) 
  : LogLevel.INFO;

// ログメッセージの型定義
interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: string;
  component?: string;
  action?: string;
  data?: any;
  error?: any;
}

/**
 * ログメッセージをフォーマット
 * 
 * @param level ログレベル
 * @param message メッセージ
 * @param error エラーオブジェクト（オプション）
 * @param meta メタデータ（オプション）
 * @returns フォーマットされたログメッセージ
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  error?: any,
  meta?: { component?: string; action?: string; [key: string]: any }
): LogMessage {
  const timestamp = new Date().toISOString();
  
  // エラーオブジェクトの処理
  let errorData: any = undefined;
  if (error) {
    if (error instanceof Error) {
      errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    } else {
      errorData = error;
    }
  }
  
  // メタデータの抽出
  const { component, action, ...data } = meta || {};
  
  return {
    level,
    message,
    timestamp,
    component,
    action,
    data: Object.keys(data).length > 0 ? data : undefined,
    error: errorData
  };
}

/**
 * ログメッセージを出力
 * 
 * @param logMessage ログメッセージオブジェクト
 */
function outputLog(logMessage: LogMessage): void {
  // 現在のログレベルよりも高いレベルのログは出力しない
  if (logMessage.level > currentLogLevel) {
    return;
  }
  
  // ログレベルに応じた出力メソッドを選択
  let logMethod: (message?: any, ...optionalParams: any[]) => void;
  
  switch (logMessage.level) {
    case LogLevel.ERROR:
      logMethod = console.error;
      break;
    case LogLevel.WARN:
      logMethod = console.warn;
      break;
    case LogLevel.DEBUG:
      logMethod = console.debug;
      break;
    case LogLevel.INFO:
    default:
      logMethod = console.info;
      break;
  }
  
  // ログレベルの文字列表現
  const levelString = LogLevel[logMessage.level];
  
  // コンポーネントとアクションの文字列
  const componentAction = [
    logMessage.component,
    logMessage.action
  ].filter(Boolean).join(':');
  
  // 基本的なログメッセージ
  const baseMessage = [
    `[${levelString}]`,
    componentAction ? `[${componentAction}]` : '',
    logMessage.message
  ].filter(Boolean).join(' ');
  
  // ログ出力
  if (logMessage.error) {
    logMethod(baseMessage, '\nError:', logMessage.error);
  } else if (logMessage.data) {
    logMethod(baseMessage, '\nData:', logMessage.data);
  } else {
    logMethod(baseMessage);
  }
  
  // 開発環境では詳細なログをコンソールに出力
  if (process.env.NODE_ENV === 'development' && logMessage.level <= LogLevel.DEBUG) {
    console.dir(logMessage, { depth: null, colors: true });
  }
}

/**
 * ロガーオブジェクト
 */
export const logger = {
  /**
   * エラーログを出力
   * 
   * @param message メッセージ
   * @param error エラーオブジェクト（オプション）
   * @param meta メタデータ（オプション）
   */
  error(message: string, error?: any, meta?: { component?: string; action?: string; [key: string]: any }): void {
    const logMessage = formatLogMessage(LogLevel.ERROR, message, error, meta);
    outputLog(logMessage);
  },
  
  /**
   * 警告ログを出力
   * 
   * @param message メッセージ
   * @param meta メタデータ（オプション）
   */
  warn(message: string, meta?: { component?: string; action?: string; [key: string]: any }): void {
    const logMessage = formatLogMessage(LogLevel.WARN, message, undefined, meta);
    outputLog(logMessage);
  },
  
  /**
   * 情報ログを出力
   * 
   * @param message メッセージ
   * @param meta メタデータ（オプション）
   */
  info(message: string, meta?: { component?: string; action?: string; [key: string]: any }): void {
    const logMessage = formatLogMessage(LogLevel.INFO, message, undefined, meta);
    outputLog(logMessage);
  },
  
  /**
   * デバッグログを出力
   * 
   * @param message メッセージ
   * @param meta メタデータ（オプション）
   */
  debug(message: string, meta?: { component?: string; action?: string; [key: string]: any }): void {
    const logMessage = formatLogMessage(LogLevel.DEBUG, message, undefined, meta);
    outputLog(logMessage);
  },
  
  /**
   * 現在のログレベルを取得
   * 
   * @returns 現在のログレベル
   */
  getLogLevel(): LogLevel {
    return currentLogLevel;
  },
  
  /**
   * ログレベルの文字列表現を取得
   * 
   * @returns ログレベルの文字列表現
   */
  getLogLevelString(): string {
    return LogLevel[currentLogLevel];
  }
};

export default logger;
