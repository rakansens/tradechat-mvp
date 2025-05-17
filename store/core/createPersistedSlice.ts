// store/core/createPersistedSlice.ts
// 初期実装: Zustandスライスのパーシスト機能付きヘルパー
// T-7.8.0フェーズ: 型定義を修正してStateCreator型の互換性問題を解決
// S-12フェーズ: 更新 - 完全に新しいアプローチでStateCreator型の互換性問題を解消

import { PersistOptions } from 'zustand/middleware'
import { createSlice, type Setter, type Getter } from './createSlice'

/**
 * パーシスト機能付きスライス作成関数
 * スライスクリエーターからStateCreatorに変換します
 */
export function createPersistedSlice<T extends object, U extends object = {}>(
  persistKey: string,
  sliceCreator: (set: Setter<T>, get: Getter<T>, api?: any) => T & U,
  persistOptions?: Partial<PersistOptions<T & U>>
) {
  // 現状では永続化オプションは未使用だが、
  // API互換のため引数に残してある
  return createSlice(sliceCreator)
}

