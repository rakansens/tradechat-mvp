// store/socket/index.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのエントリーポイント
// 更新: 2025-05-10 - StateCreator型の修正
// 更新: 2025-05-14 - Zustandストアの作成とエクスポート

import { StateCreator, create } from 'zustand';
import { initialSocketState } from './state';
import { SocketSlice, createSocketSliceActions } from './actions';
import { selectConnected, selectSocketId } from './selectors';

/**
 * ソケットスライスを作成する
 * @param set Zustandのset関数
 * @param get Zustandのget関数
 * @returns SocketSlice
 */
export const createSocketSlice: StateCreator<
  SocketSlice,
  [],
  [],
  SocketSlice
> = (set, get, _store) => ({
  ...initialSocketState,
  ...createSocketSliceActions(set, get, _store)
});

/**
 * ソケット状態を管理するZustandストア
 */
export const useSocketStore = create<SocketSlice>()((...args) => ({
  ...createSocketSlice(...args)
}));

// セレクターをエクスポート
export { selectConnected, selectSocketId };

// 型をエクスポート
export type { SocketSlice }; 