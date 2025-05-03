// services/api.ts
// 追加: API通信の共通化と型安全性の向上

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleApiError } from './errorHandler';

// 環境判定
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_BROWSER = typeof window !== 'undefined';

// API設定
export const API_CONFIG = {
  bitget: {
    baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL || 'https://api.bitget.com',
    wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL || 'wss://ws.bitget.com/v2/ws/public',
    enableDemoMode: false // デモモード無効
  }
};

// API応答の基本型
export interface ApiResponse<T = any> {
  code?: string;
  msg?: string;
  data?: T;
  success?: boolean;
  error?: string;
}

/**
 * 共通APIリクエスト関数
 * @param config リクエスト設定
 * @returns レスポンスデータ
 */
export async function apiRequest<T = any>(config: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  errorTitle?: string;
  errorDescription?: string;
  showToast?: boolean;
  fallbackData?: T | null;
  signal?: AbortSignal;
}): Promise<T> {
  const {
    url,
    method = 'GET',
    params,
    data,
    headers,
    errorTitle,
    errorDescription,
    showToast = IS_DEV,
    fallbackData = null,
    signal
  } = config;

  try {
    if (IS_DEV) {
      console.log(`API Request: ${method} ${url}`);
      if (params) console.log('Params:', params);
      if (data) console.log('Data:', data);
    }

    const response = await axios({
      url,
      method,
      params,
      data,
      headers,
      signal
    });

    // レスポンスの検証
    if (!response.data) {
      throw new Error('Empty API response');
    }

    // Bitget APIのエラーチェック
    if (response.data.code && response.data.code !== '00000' && response.data.code !== '0') {
      throw new Error(response.data.msg || 'API error');
    }

    // データ部分を返す（APIによって異なる場合がある）
    if (response.data.data !== undefined) {
      return response.data.data as T;
    }

    return response.data as T;
  } catch (error) {
    // エラーハンドラーを使用
    handleApiError(error, {
      title: errorTitle || 'APIリクエストエラー',
      description: errorDescription,
      showToast
    });

    // フォールバックデータが指定されていれば返す
    if (fallbackData !== null) {
      return fallbackData;
    }

    // それ以外はエラーを再スロー
    throw error;
  }
}

/**
 * ブラウザ環境用のNext.js APIルートを使用したリクエスト
 * @param endpoint APIエンドポイント（例: '/api/bitget/candles'）
 * @param params クエリパラメータ
 * @param options その他のオプション
 * @returns レスポンスデータ
 */
export async function browserApiRequest<T = any>(
  endpoint: string,
  params: Record<string, any> = {},
  options: Omit<Parameters<typeof apiRequest>[0], 'url' | 'params'> = {}
): Promise<T> {
  // URLSearchParamsを使用してクエリ文字列を構築
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;

  return apiRequest<T>({
    url,
    params: undefined,
    ...options as any // 型互換性のために一時的に any を使用
  });
}

/**
 * サーバー環境用の直接APIリクエスト
 * @param baseUrl ベースURL
 * @param endpoint エンドポイント
 * @param params クエリパラメータ
 * @param options その他のオプション
 * @returns レスポンスデータ
 */
export async function serverApiRequest<T = any>(
  baseUrl: string,
  endpoint: string,
  params: Record<string, any> = {},
  options: Omit<Parameters<typeof apiRequest>[0], 'url' | 'params'> = {}
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  
  return apiRequest<T>({
    url,
    params,
    ...options as any // 型互換性のために一時的に any を使用
  });
}

/**
 * 環境に応じたAPIリクエスト（ブラウザかサーバーかを自動判定）
 * @param config リクエスト設定
 * @returns レスポンスデータ
 */
export async function adaptiveApiRequest<T = any>(config: {
  browserEndpoint: string;
  serverBaseUrl: string;
  serverEndpoint: string;
  params: Record<string, any>;
  options?: Omit<Parameters<typeof apiRequest>[0], 'url' | 'params'>;
}): Promise<T> {
  const { browserEndpoint, serverBaseUrl, serverEndpoint, params, options = {} } = config;

  if (IS_BROWSER) {
    return browserApiRequest<T>(browserEndpoint, params, options) as Promise<T>;
  } else {
    return serverApiRequest<T>(serverBaseUrl, serverEndpoint, params, options) as Promise<T>;
  }
}

/**
 * APIリクエストのキャンセル機能を提供
 * @returns コントローラーとシグナル
 */
export function createCancellableRequest() {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort()
  };
}
