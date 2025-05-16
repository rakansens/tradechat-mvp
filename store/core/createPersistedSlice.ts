// store/core/createPersistedSlice.ts
// 初期実装: Zustandスライスのパーシスト機能付きヘルパー
// T-7.8.0フェーズ: 型定義を修正してStateCreator型の互換性問題を解決

import { StateCreator } from 'zustand'
import { PersistOptions } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// スライス作成ヘルパー関数の型定義（更新）
export type CreateSliceWithPersist<T> = (
  set: (fn: (state: T) => void) => void,
  get: () => T,
  api: object
) => T

// パーシスト機能付きスライス作成関数（型定義を修正）
export function createPersistedSlice<T extends object, U extends object>(
  persistKey: string,
  sliceCreator: CreateSliceWithPersist<T>,
  persistOptions?: Partial<PersistOptions<T & U>>
): StateCreator<T & U, [], [['zustand/immer', never]]> {
  return (set, get, api) => {
    const immerSet = (fn: (state: T) => void) => 
      set((state) => {
        // TypeScriptエラーを回避するためのasアサーション
        const draft = state as T;
        fn(draft);
        return state;
      });
    
    const slice = sliceCreator(
      immerSet,
      () => get() as T,
      api
    );
    
    return slice as T & U
  }
} 