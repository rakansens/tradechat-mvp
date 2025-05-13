// store/dataFetch/index.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴うエントリーポイント
// 役割: DataFetchスライスの全コンポーネントをまとめ、外部から使いやすい形で公開する

import { initialDataFetchState, DataFetchSliceState } from './state';
import { createDataFetchActions, DataFetchSliceActions } from './actions';
import { createPersistedSlice } from '@/store/core/createPersistedSlice';

// DataFetchスライスの型定義
export type DataFetchSlice = DataFetchSliceState & DataFetchSliceActions;

// DataFetchスライスの作成関数
export const createDataFetchSlice = createPersistedSlice<DataFetchSliceState, Record<string, unknown>>(
  'dataFetch-v1', // persistキー
  (set, get, api) => ({
    ...initialDataFetchState,
    ...createDataFetchActions(set, get)
  })
);

// 型定義をエクスポート
export * from './state';
export * from './actions';
export * from './selectors'; 