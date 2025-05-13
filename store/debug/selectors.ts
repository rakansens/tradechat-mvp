// store/debug/selectors.ts
// 作成: 2025-05-15 - デバッグスライスのセレクター実装

import { createMemoSelector } from '@/store/core/selectors';
import type { DebugSliceState } from './state';
import type { RootStore } from '@/store/rootStore';

/**
 * デバッグモードの状態を取得するセレクター
 */
export const selectIsDebugMode = createMemoSelector<RootStore, boolean>(
  (state) => state.isDebugMode
); 