// types/store/dataFetch.ts
// 作成: 2025-10-07 - データフェッチストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/dataFetch/state.tsの定義を統合

import { ExchangeType } from '@/types/api';

/**
 * このファイルはデータフェッチストアの型定義を提供します。
 * APIリクエストの状態管理をZustandで行うための型定義です。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

// アクティブデータ取得の型定義
export interface ActiveFetch {
  symbol: string;
  type: 'orderbook' | 'chart' | 'trades';
  exchangeType: ExchangeType;
  abortController: AbortController;
  timestamp: number;
  duration?: number; // 実行時間（ミリ秒）
}

// リクエスト状態の型
export enum RequestStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 汎用的なデータフェッチの状態
export interface FetchState<T = any> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
  lastUpdated: number | null;
}

// キャッシュ設定の型
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // milliseconds
}

// リトライ設定の型
export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffFactor: number;
  initialDelay: number; // milliseconds
}

// データフェッチの設定
export interface DataFetchConfig {
  cache: CacheConfig;
  retry: RetryConfig;
  timeout: number; // milliseconds
  deduplicate: boolean;
}

// データフェッチスライスの状態型定義
export interface DataFetchState {
  // アクティブなデータ取得リスト
  activeFetches: ActiveFetch[];
  
  // データリクエストの管理
  requests: Record<string, FetchState>;
  config: DataFetchConfig;
}

// データフェッチスライスのアクション定義
export interface DataFetchActions {
  // アクティブフェッチ管理
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => void;
  cancelAllFetches: () => void;
  addFetch: (fetch: Omit<ActiveFetch, 'timestamp'>) => void;
  removeFetch: (type: 'orderbook' | 'chart' | 'trades', symbol: string) => void;
  
  // リクエスト管理
  startRequest: (key: string) => void;
  setRequestSuccess: <T>(key: string, data: T) => void;
  setRequestError: (key: string, error: string) => void;
  clearRequest: (key: string) => void;
  clearAllRequests: () => void;
  
  // 設定管理
  setConfig: (config: Partial<DataFetchConfig>) => void;
  
  // デバッグ関連
  getActiveFetchesInfo: () => (ActiveFetch & { duration: number })[];
}

// 完全なデータフェッチスライスの型定義
export type DataFetchSlice = DataFetchState & DataFetchActions; 