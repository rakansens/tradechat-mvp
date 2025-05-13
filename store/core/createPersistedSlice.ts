// store/core/createPersistedSlice.ts
// 初期実装: Zustandスライスのパーシスト機能付きヘルパー

import { StateCreator } from 'zustand'
import { PersistOptions } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// スライス作成ヘルパー関数の型定義
export type CreateSliceWithPersist<T> = (
  set: (fn: (state: T) => void) => void,
  get: () => T,
  api: object
) => T

// パーシスト機能付きスライス作成関数
export const createPersistedSlice = <T extends object, U extends object>(
  persistKey: string,
  sliceCreator: CreateSliceWithPersist<T>,
  persistOptions?: Partial<PersistOptions<T & U>>
): StateCreator<T & U, [], [['zustand/immer', never]]> => {
  return (set, get, api) => {
    const slice = sliceCreator(
      (fn) => set(immer<T & U>((state) => { fn(state as T) })),
      () => get() as T,
      api
    )
    
    return slice as T & U
  }
} 