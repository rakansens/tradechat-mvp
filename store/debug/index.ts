// store/debug/index.ts
// 作成: 2025-05-15 - デバッグスライスのエントリーポイント
// 更新: 2025-05-15 - 型エクスポートを修正

import { DebugSliceState, initialDebugState } from './state';
import { DebugSliceActions, createDebugActions } from './actions';

// デバッグスライスの型をエクスポート
export type DebugSlice = DebugSliceState & DebugSliceActions;

// デバッグスライスの作成関数
export const createDebugSlice = (
  set: (fn: (state: DebugSliceState) => void) => void,
  get: () => DebugSliceState,
  api?: any
): DebugSlice => {
  // アクションを作成
  const actions = createDebugActions(set, get);

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialDebugState,
    ...actions
  };
};

// メモ化されたセレクターのエクスポート
export * from './selectors'; 