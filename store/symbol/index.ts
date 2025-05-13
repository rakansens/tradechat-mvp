// store/symbol/index.ts
// 作成: SymbolSliceの統合とエクスポート
// 更新: Zustandのset関数の型定義を修正

import { SymbolSliceState, initialSymbolState } from './state';
import { SymbolActions, SymbolSlice, createSymbolActions } from './actions';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

/**
 * SymbolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createSymbolSlice = <T extends SymbolSlice>(
  set: any, // Zustandのset関数の型を適切に扱うためany型を使用
  get: () => T
): SymbolSlice => {
  // immerをここで使用して状態更新を簡略化
  const immerSet = (fn: (state: T) => void) => set(fn);
  
  return {
    // 初期状態
    ...initialSymbolState,
    
    // アクション（immerSetを渡す）
    ...createSymbolActions(immerSet, get)
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
export type { SymbolSlice, SymbolActions, SymbolSliceState }; 