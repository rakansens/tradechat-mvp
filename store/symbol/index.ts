// store/symbol/index.ts
// 作成: SymbolSliceの統合とエクスポート
// 更新: Zustandのset関数の型定義を修正
// 更新: T-7.7.5フェーズ - get関数の戻り値型をSymbolSliceに修正して型安全性を向上
// 更新: T-7.8フェーズ - StoreApi型を使用してSliceの型安全性を向上

import { SymbolSliceState, initialSymbolState } from './state';
import { SymbolActions, SymbolSlice, createSymbolActions } from './actions';
import { create, type StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * SymbolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createSymbolSlice = (
  set: StoreApi<SymbolSlice>['setState'],
  get: StoreApi<SymbolSlice>['getState']
): SymbolSlice => {
  // 初期状態をコピー
  const state: SymbolSliceState = { ...initialSymbolState };
  
  // アクションを作成
  const actions = createSymbolActions(
    (fn) => set((store) => {
      // fnが関数の場合は実行し、そうでなければ部分的な状態として適用
      if (typeof fn === 'function') {
        const draft = store as SymbolSliceState;
        fn(draft);
        return store;
      } else {
        return { ...store, ...fn };
      }
    }),
    () => get() as SymbolSliceState
  );
  
  // 状態とアクションを合わせたスライスを返す
  return {
    ...state,
    ...actions
  };
};

/**
 * SymbolSliceを使用したスタンドアロンストア
 * このストアは移行期間中に使用され、最終的にはrootStoreに統合されます
 * @deprecated 代わりにrootStoreのSymbolSliceを使用してください
 */
export const useSymbolStore = create<SymbolSlice>()(
  devtools(
    immer((set, get) => createSymbolSlice(
      set as StoreApi<SymbolSlice>['setState'],
      get as StoreApi<SymbolSlice>['getState']
    )),
    { name: "symbol-store" }
  )
);

// 型をエクスポート
export type { SymbolSlice, SymbolActions, SymbolSliceState };