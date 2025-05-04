// utils/logger.ts
// 作成: 集中型ロギングシステム
// 
// このファイルはアプリケーション全体で一貫したロギングを提供します。
// コンソールログの代わりにこのロガーを使用することで、デバッグが容易になります。

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// 環境変数で設定するか、デフォルトでINFOレベル
const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.ERROR  // 本番環境ではエラーのみ
  : LogLevel.DEBUG; // 開発環境ではすべてのログ

interface LogContext {
  component?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = DEFAULT_LOG_LEVEL;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public error(message: string, error?: any, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, error, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, null, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, null, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, null, context);
  }

  private log(level: LogLevel, message: string, error?: any, context?: LogContext): void {
    // ログレベルに基づいてフィルタリング
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    if (messageLevelIndex > currentLevelIndex) {
      return;
    }

    const timestamp = new Date().toISOString();
    const formattedContext = context ? this.formatContext(context) : '';
    
    // コンソールへの出力
    switch (level) {
      case LogLevel.ERROR:
        console.error(
          `[${timestamp}] %c${level.toUpperCase()}%c ${message}`, 
          'color: red; font-weight: bold', 
          'color: inherit',
          formattedContext,
          error ? this.formatError(error) : ''
        );
        break;
      case LogLevel.WARN:
        console.warn(
          `[${timestamp}] %c${level.toUpperCase()}%c ${message}`, 
          'color: orange; font-weight: bold', 
          'color: inherit',
          formattedContext
        );
        break;
      case LogLevel.INFO:
        console.info(
          `[${timestamp}] %c${level.toUpperCase()}%c ${message}`, 
          'color: blue; font-weight: bold', 
          'color: inherit',
          formattedContext
        );
        break;
      case LogLevel.DEBUG:
        console.debug(
          `[${timestamp}] %c${level.toUpperCase()}%c ${message}`, 
          'color: gray; font-weight: bold', 
          'color: inherit',
          formattedContext
        );
        break;
    }
  }

  private formatContext(context: LogContext): string {
    try {
      return JSON.stringify(context, null, 2);
    } catch (e) {
      return `[Context serialization failed: ${e}]`;
    }
  }

  private formatError(error: any): any {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    return error;
  }
}

export const logger = Logger.getInstance();
