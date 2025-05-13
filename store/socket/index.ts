// store/socket/index.ts
// SocketSliceのエントリーポイント - 2025-05-13
// 更新: 2025-05-15 - SocketSlice型をエクスポート追加

import { StoreApi } from 'zustand';
import { initialSocketState } from './state';
import { createSocketSliceActions, SocketSlice } from './actions';
import { logger } from '@/utils/common';

// 型のリエクスポート
export type { SocketSliceState } from './state';
export type { SocketSliceActions, SocketSlice } from './actions';

// サイドエフェクトのエクスポート
export { initializeSocketMonitoring, cleanupSocketMonitoring } from './dispatcher';

/**
 * SocketSliceを作成する関数
 * rootStoreに統合するためのファクトリ関数
 */
export const createSocketSlice = <T extends object>(
  set: StoreApi<T>['setState'],
  get: StoreApi<T>['getState'],
  store: StoreApi<T>
) => {
  // スライスの初期化ログ
  logger.info('SocketSliceを初期化します', {
    component: 'SocketSlice',
    action: 'init'
  });
  
  // 状態とアクションを結合して返す
  return {
    ...initialSocketState,
    ...createSocketSliceActions(set as any, get as any, store as any)
  };
}; 