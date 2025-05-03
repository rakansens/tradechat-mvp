// services/errorHandler.ts
// 追加: グローバルなエラーハンドリング機能

import { toast } from 'sonner';
import { AxiosError } from 'axios';

// 環境判定
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_BROWSER = typeof window !== 'undefined';

// エラーの種類を区別するための型
export type ErrorSource = 'api' | 'websocket' | 'chart' | 'general';

// エラー通知オプション
interface ErrorNotifyOptions {
  source: ErrorSource;
  title?: string;
  description?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * エラーを適切に処理し、必要に応じて通知する
 * @param error 発生したエラー
 * @param options 通知オプション
 */
export function handleError(error: unknown, options: ErrorNotifyOptions) {
  const { 
    source, 
    title = 'エラーが発生しました', 
    description,
    showToast = true, 
    logToConsole = IS_DEV 
  } = options;

  // エラーメッセージの抽出
  let errorMessage = '';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error && typeof error === 'object') {
    // AxiosErrorの場合
    if ((error as AxiosError).isAxiosError) {
      const axiosError = error as AxiosError;
      // axiosError.response?.data は any 型なので、安全にアクセス
      const responseData = axiosError.response?.data as Record<string, any> | undefined;
      errorMessage = responseData?.msg 
        || axiosError.response?.statusText 
        || axiosError.message 
        || 'APIリクエストエラー';
    } else {
      // その他のオブジェクト型エラー
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = '不明なエラー';
      }
    }
  } else {
    errorMessage = '不明なエラー';
  }

  // エラーソース別のプレフィックス
  const sourcePrefix = {
    api: 'API',
    websocket: 'WebSocket',
    chart: 'Chart',
    general: 'Error'
  }[source];

  // コンソールへのログ出力
  if (logToConsole) {
    console.error(`[${sourcePrefix}] ${errorMessage}`, error);
  }

  // ブラウザ環境でのみトースト通知を表示
  if (IS_BROWSER && showToast) {
    toast.error(title, {
      description: description || errorMessage,
      duration: 5000,
    });
  }

  return errorMessage;
}

/**
 * API呼び出しエラーを処理し、フォールバックデータを返す
 * @param error 発生したエラー
 * @param fallbackData エラー時に返すフォールバックデータ
 * @param options 通知オプション
 */
export function handleApiError<T>(
  error: unknown, 
  fallbackData: T | null = null,
  options: Omit<ErrorNotifyOptions, 'source'> = {}
): T | null {
  handleError(error, {
    source: 'api',
    title: 'APIエラー',
    ...options
  });
  
  return fallbackData;
}

/**
 * WebSocketエラーを処理する
 * @param error 発生したエラー
 * @param options 通知オプション
 */
export function handleWebSocketError(
  error: unknown,
  options: Omit<ErrorNotifyOptions, 'source'> = {}
): void {
  handleError(error, {
    source: 'websocket',
    title: 'WebSocket接続エラー',
    ...options
  });
}

/**
 * チャート関連エラーを処理する
 * @param error 発生したエラー
 * @param options 通知オプション
 */
export function handleChartError(
  error: unknown,
  options: Omit<ErrorNotifyOptions, 'source'> = {}
): void {
  handleError(error, {
    source: 'chart',
    title: 'チャートエラー',
    ...options
  });
}
