// store/dataFetch/state.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴う状態定義
// 役割: DataFetchスライスの状態型を定義し、初期値を提供する

import { ExchangeType } from '@/types/constants/enums';

// アクティブデータ取得の型定義
export interface ActiveFetch {
  symbol: string;
  type: 'orderbook' | 'chart' | 'trades';
  exchangeType: ExchangeType;
  abortController: AbortController;
  timestamp: number;
  duration?: number; // 実行時間（ミリ秒）
}

// DataFetchスライスの状態型定義
export interface DataFetchSliceState {
  activeFetches: ActiveFetch[];
}

// 初期状態
export const initialDataFetchState: DataFetchSliceState = { 
  activeFetches: [] 
}; 