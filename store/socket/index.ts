// store/socket/index.ts
// SocketSliceのエントリーポイント - 2025-05-13
// 更新: 2025-05-15 - SocketSlice型をエクスポート追加

import { type StoreApi } from 'zustand';
import { initialSocketState } from './state';
import type { SocketSliceState } from './state';
import { createSocketSliceActions, SocketSlice } from './actions';
import { logger } from '@/utils/common';
import type { RootStore } from '../rootStore';
import { createImmerSetter } from '../core/immerSet';
import type { SliceCreator } from '@/types/store/core';

// 型のリエクスポート
export type { SocketSliceState } from './state';
export type { SocketSliceActions, SocketSlice } from './actions';

// サイドエフェクトのエクスポート
export { initializeSocketMonitoring, cleanupSocketMonitoring } from './dispatcher';

/**
 * SocketSliceを作成する関数
 * rootStoreに統合するためのファクトリ関数
 */
export type SocketSliceCreator = SliceCreator<SocketSlice, SocketSliceState>;

export const createSocketSlice: SocketSliceCreator = (
  set,
  get,
  store
) => {
  // スライスの初期化ログ
  logger.info('SocketSliceを初期化します', {
    component: 'SocketSlice',
    action: 'init'
  });

  // 状態とアクションを結合して返す
  return {
    ...initialSocketState,
    ...createSocketSliceActions(
      createImmerSetter<SocketSliceState>(set),
      () => get() as SocketSliceState,
      store as StoreApi<RootStore>
    )
  };
};
