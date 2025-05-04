// utils/errorHandlers.ts
// 作成: グローバルエラーハンドリング機能の実装
// このファイルは未処理のPromise rejectionやJavaScriptエラーをキャッチする機能を提供します

import { logger } from './logger';
import { saveLogToStorage, LOG_LEVEL } from './logStorage';

/**
 * グローバルエラーハンドラーをセットアップする
 * ブラウザ環境でのみ実行可能
 */
export function setupGlobalErrorHandlers() {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined') return;

  // 未処理のPromise rejectionをキャッチ
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason, {
      component: 'GlobalErrorHandler',
      action: 'unhandledRejection',
      stack: event.reason?.stack,
      message: event.reason?.message || 'Unknown rejection reason'
    });
    
    // エラーの詳細をストレージに保存
    saveLogToStorage(LOG_LEVEL.ERROR, 'Unhandled Promise Rejection', event.reason, {
      component: 'GlobalErrorHandler',
      action: 'unhandledRejection'
    });
    
    // デフォルトの動作は防止しない（アプリケーションの挙動に影響を与えないため）
    // event.preventDefault();
  });

  // グローバルなJavaScriptエラーをキャッチ
  window.addEventListener('error', (event) => {
    const errorInfo = {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    };

    logger.error('Uncaught JavaScript Error', event.error, {
      component: 'GlobalErrorHandler',
      action: 'uncaughtError',
      ...errorInfo
    });
    
    // エラーの詳細をストレージに保存
    saveLogToStorage(LOG_LEVEL.ERROR, `Uncaught JavaScript Error: ${event.message}`, event.error, {
      component: 'GlobalErrorHandler',
      action: 'uncaughtError',
      ...errorInfo
    });
    
    // デフォルトの動作は防止しない（アプリケーションの挙動に影響を与えないため）
    // event.preventDefault();
  });

  // React Error Boundaryでキャッチできないエラー（非同期処理など）をログに記録
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Reactのエラーメッセージを検出（典型的なパターン）
    const errorMessage = args[0];
    if (typeof errorMessage === 'string' && 
        (errorMessage.includes('React will try to recreate this component tree') || 
         errorMessage.includes('Error boundaries should catch all errors'))) {
      
      const error = args.find(arg => arg instanceof Error) || new Error(errorMessage);
      
      logger.error('React Error', error, {
        component: 'GlobalErrorHandler',
        action: 'reactError',
        args: args.map(arg => 
          arg instanceof Error 
            ? { message: arg.message, stack: arg.stack } 
            : arg
        )
      });
      
      // エラーの詳細をストレージに保存
      saveLogToStorage(LOG_LEVEL.ERROR, 'React Error', error, {
        component: 'GlobalErrorHandler',
        action: 'reactError'
      });
    }
    
    // 元のconsole.errorを呼び出す
    originalConsoleError.apply(console, args);
  };

  logger.info('Global error handlers initialized', {
    component: 'GlobalErrorHandler',
    action: 'setup'
  });
}
