/**
 * API関連の型定義
 * 
 * このファイルはAPI通信に関連する型定義を集約しています。
 * - APIレスポンスの基本型
 * - APIリクエスト設定
 * - エラーハンドリング関連の型
 * - 取引所関連の型
 * 
 * 更新: 2025-10-08 - S-9.1: ExchangeType定義を統一
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ExchangeType, ProductType } from '@/types/exchange';

/**
 * 取引所タイプから取引プロダクトタイプへの変換マッピング
 * 中間移行のために使用
 */
export const EXCHANGE_TO_PRODUCT_TYPE: Record<string, ProductType> = {
  'bitget': 'spot',
  'binance': 'spot',
  'bybit': 'spot',
  'demo': 'futures'
};

/**
 * 取引プロダクトタイプから取引所タイプへのデフォルト変換（後方互換性）
 */
export const PRODUCT_TO_EXCHANGE_TYPE: Record<ProductType, ExchangeType> = {
  'spot': 'bitget',
  'futures': 'demo'
};

// 型を再エクスポート
export type { ExchangeType, ProductType };

/**
 * Bitget API認証情報
 */
export interface BitgetCredentials {
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
}

/**
 * API応答の基本型
 * 
 * 注意: この型は次の二つのパターンをサポートしています:
 * 1. Bitget API形式: { code, msg, data }
 * 2. 標準形式: { success, data, error }
 */
export interface ApiResponse<T = any> {
  // Bitget API形式のフィールド
  code?: string;
  msg?: string;
  
  // 標準形式のフィールド
  success?: boolean;
  data?: T;
  
  // エラー情報
  error?: string | {
    code: string;
    message: string;
  };
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