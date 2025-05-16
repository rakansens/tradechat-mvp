// store/dataFetch/index.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴うエントリーポイント
// 役割: DataFetchスライスの全コンポーネントをまとめ、外部から使いやすい形で公開する
// 更新: 2025-06-30 - 型安全性を強化するためにジェネリック型を追加
// 更新: 2025-10-08 - CH-07実装: 共通MutateDraft/SliceCreator型を使用

import { initialDataFetchState, DataFetchSliceState } from './state';
import { createDataFetchActions, DataFetchSliceActions } from './actions';
import { StoreApi } from 'zustand';
import { createImmerSetter } from '@/store/core/immerSet';
import { type SliceCreator } from '@/types/store/core';

// DataFetchスライスの型定義
export type DataFetchSlice = DataFetchSliceState & DataFetchSliceActions;

// DataFetchスライスクリエーター型定義
export type DataFetchSliceCreator = SliceCreator<DataFetchSlice, DataFetchSliceState>;

// DataFetchスライスの作成関数
export const createDataFetchSlice: DataFetchSliceCreator = (
  set,
  get,
  api
): DataFetchSlice => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<DataFetchSliceState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as DataFetchSliceState;
  
  // アクションを作成
  const actions = createDataFetchActions(
    immerSet,
    getState
  );
  
  // 状態とアクションを合わせたスライスを返す
  return {
    ...initialDataFetchState,
    ...actions
  };
};

// 型定義をエクスポート
export * from './state';
export * from './actions';
export * from './selectors'; 