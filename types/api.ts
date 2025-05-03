/**
 * API関連の型定義
 * 
 * このファイルはAPI通信に関連する型定義を集約しています。
 * - APIレスポンスの基本型
 * - APIリクエスト設定
 * - エラーハンドリング関連の型
 * - 取引所関連の型
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * 取引所タイプ
 */
export type ExchangeType = 'spot' | 'futures';

/**
 * API応答の基本型
 */
export interface ApiResponse<T = any> {
  code?: string;
  msg?: string;
  data?: T;
  success?: boolean;
  error?: string;
}

/**
 * APIリクエスト設定
 */
export interface ApiRequestConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  errorTitle?: string;
  errorDescription?: string;
  showToast?: boolean;
  fallbackData?: any | null;
  signal?: AbortSignal;
}

/**
 * APIエラーハンドラー設定
 */
export interface ApiErrorHandlerOptions {
  title?: string;
  description?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * WebSocketエラーハンドラー設定
 */
export interface WebSocketErrorHandlerOptions {
  title?: string;
  showToast?: boolean;
  logToConsole?: boolean;
}

/**
 * キャンセル可能なリクエスト結果
 */
export interface CancellableRequest {
  signal: AbortSignal;
  cancel: () => void;
}

/**
 * 環境設定
 */
export interface ApiEnvironmentConfig {
  baseUrl: string;
  wsUrl: string;
  enableDemoMode: boolean;
}

/**
 * アダプティブAPIリクエスト設定
 */
export interface AdaptiveApiRequestConfig<T = any> {
  browserEndpoint: string;
  serverBaseUrl: string;
  serverEndpoint: string;
  params: Record<string, any>;
  options?: Omit<ApiRequestConfig, 'url' | 'params'>;
}
