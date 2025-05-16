// store/symbol/index.ts
// 作成: SymbolSliceの統合とエクスポート
// 更新: Zustandのset関数の型定義を修正
// 更新: T-7.7.5フェーズ - get関数の戻り値型をSymbolSliceに修正して型安全性を向上
// 更新: T-7.8フェーズ - StoreApi型を使用してSliceの型安全性を向上
// 更新: 2025-10-05 - 型定義をtypes.tsに移動し、SliceCreator型に準拠するように修正

import { initialSymbolState } from './state';
import { createSymbolActions } from './actions';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { type SymbolSlice, type SymbolSliceState, type SymbolSliceCreator } from './types';
import { createImmerSetter } from '@/store/core/immerSet';

/**
 * SymbolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createSymbolSlice: SymbolSliceCreator = (
  set,
  get
) => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<SymbolSliceState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as SymbolSlice;
  
  // アクションを作成
  const actions = createSymbolActions(
    set,
    getState
  );
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態
    ...initialSymbolState,
    
    // アクション
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
    immer((set, get) => createSymbolSlice(set, get)),
    { name: "symbol-store" }
  )
);

// 型をエクスポート
export type { SymbolSlice, SymbolSliceState, SymbolSliceActions } from './types';