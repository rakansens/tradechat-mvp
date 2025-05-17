// services/api/common/request.ts
// 移動: api.tsから移動
// 更新: 環境変数と型の参照先を変更

import axios from 'axios';
import { handleApiError } from '../../errors';
import {
  ApiResponse,
  ApiRequestConfig,
  AdaptiveApiRequestConfig,
  ApiRequestOptions,
  CancellableRequest
} from '@/types/api';
import { IS_DEV, IS_BROWSER, getApiConfig } from './environment';

/**
 * 共通APIリクエスト関数
 * @param config リクエスト設定
 * @returns レスポンスデータ
 */
export async function apiRequest<T = any>(config: ApiRequestConfig): Promise<T> {
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
  options: ApiRequestOptions = {}
): Promise<T> {
  // 修正: クエリパラメータをURLに埋め込むのではなく、axiosのparamsとして渡す
  return apiRequest<T>({
    url: endpoint,
    params: params,  // paramsをそのまま渡す
    ...options
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
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;

  return apiRequest<T>({
    url,
    params,
    ...options
  });
}

/**
 * 環境に応じたAPIリクエスト（ブラウザかサーバーかを自動判定）
 * @param config リクエスト設定
 * @returns レスポンスデータ
 */
export async function adaptiveApiRequest<T = any>(config: AdaptiveApiRequestConfig): Promise<T> {
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
export function createCancellableRequest(): CancellableRequest {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort()
  };
}
