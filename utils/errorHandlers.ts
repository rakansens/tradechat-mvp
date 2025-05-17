// utils/errorHandlers.ts
// 作成: グローバルエラーハンドリング機能の実装
// このファイルは未処理のPromise rejectionやJavaScriptエラーをキャッチする機能を提供します

import { logger } from '@/utils/common';
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
    // Chrome 固有の ResizeObserver ループ警告とSES例外は無視（noise が多いため）
    if (
      typeof event.message === 'string' &&
      (event.message.includes('ResizeObserver loop') ||
       event.message.startsWith('SES_UNCAUGHT_EXCEPTION'))
    ) {
      const warnType = event.message.startsWith('SES_UNCAUGHT_EXCEPTION') ? 'ses' : 'resizeObserverLoop';
      // throttle: スロットリングを強化し、メッセージタイプごとに10秒間隔でのみログを記録
      if (!(window as any).__ignoreWarns) {
        (window as any).__ignoreWarns = {};
        (window as any).__ignoreWarnTimers = {};
      }

      const now = Date.now();
      const lastTime = (window as any).__ignoreWarnTimers[warnType] || 0;
      
      // 10秒以上経過している場合のみログを記録
      if (now - lastTime > 10000) {
        (window as any).__ignoreWarnTimers[warnType] = now;
        (window as any).__ignoreWarns[warnType] = true;
        logger.warn('ブラウザ警告をスロットリング（無視）:', {
          component: 'GlobalErrorHandler',
          action: warnType,
          message: event.message.substring(0, 100), // 長いメッセージは切り詰める
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
      // ブラウザ既定のエラー表示を抑制
      event.preventDefault?.();
      return;
    }
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
    
    // SES / ResizeObserver など noise 系を無視
    if (
      typeof errorMessage === 'string' &&
      (errorMessage.startsWith('SES_UNCAUGHT_EXCEPTION') || errorMessage.includes('lockdown-install'))
    ) {
      logger.warn('SES exception suppressed', {
        component: 'GlobalErrorHandler',
        action: 'sesConsoleError',
        msg: errorMessage
      });
      return; // swallow
    }
    
    // 元のconsole.errorを呼び出す - 安全に処理
    try {
      // argsが有効な配列であることを確認
      if (Array.isArray(args) && args.length > 0) {
        originalConsoleError.apply(console, args);
      } else {
        // 無効な引数の場合はフォールバック
        originalConsoleError.call(console, "Invalid console.error arguments", args);
      }
    } catch (e) {
      // console.errorの呼び出しに失敗した場合のフォールバック
      originalConsoleError.call(console, "Error in console.error override:", e);
    }
  };

  logger.info('Global error handlers initialized', {
    component: 'GlobalErrorHandler',
    action: 'setup'
  });
}
