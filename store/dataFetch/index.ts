// store/dataFetch/index.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴うエントリーポイント
// 役割: DataFetchスライスの全コンポーネントをまとめ、外部から使いやすい形で公開する
// 更新: 2025-06-30 - 型安全性を強化するためにジェネリック型を追加

import { initialDataFetchState, DataFetchSliceState } from './state';
import { createDataFetchActions, DataFetchSliceActions } from './actions';
import { StoreApi } from 'zustand';

// DataFetchスライスの型定義
export type DataFetchSlice = DataFetchSliceState & DataFetchSliceActions;

// DataFetchスライスの作成関数
export const createDataFetchSlice = (
  set: StoreApi<DataFetchSlice>['setState'],
  get: StoreApi<DataFetchSlice>['getState'],
  api?: StoreApi<DataFetchSlice>
): DataFetchSlice => {
  // 初期状態をコピー
  const state: DataFetchSliceState = { ...initialDataFetchState };
  
  // アクションを作成
  const actions = createDataFetchActions(
    (fn) => set((state) => {
      fn(state as DataFetchSliceState);
    }),
    () => get() as DataFetchSliceState
  );
  
  // 状態とアクションを合わせたスライスを返す
  return {
    ...state,
    ...actions
  };
};

// 型定義をエクスポート
export * from './state';
export * from './actions';
export * from './selectors'; 