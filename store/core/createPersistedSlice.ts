// store/core/createPersistedSlice.ts
// 初期実装: Zustandスライスのパーシスト機能付きヘルパー
// T-7.8.0フェーズ: 型定義を修正してStateCreator型の互換性問題を解決
// S-12フェーズ: 更新 - 完全に新しいアプローチでStateCreator型の互換性問題を解消

import { StateCreator } from 'zustand'
import { PersistOptions } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { type SliceCreator } from '@/types/store/core'

// シンプルなセッター型 - スライスに依存しない
type Setter<T> = (fn: (state: T) => void) => void;

// シンプルなゲッター型 - スライスに依存しない
type Getter<T> = () => T;

/**
 * パーシスト機能付きスライス作成関数
 * スライスクリエーターからStateCreatorに変換します
 */
export function createPersistedSlice<T extends object, U extends object = {}>(
  persistKey: string,
  sliceCreator: (set: Setter<T>, get: Getter<T>, api?: any) => T & U,
  persistOptions?: Partial<PersistOptions<T & U>>
) {
  return (
    set: any, 
    get: any, 
    api: any
  ) => {
    // シンプルなimmerラッパー関数を作成
    const immerSetter: Setter<T> = (fn) => {
      set(immer((state: any) => {
        fn(state);
      }));
    };
    
    // 型安全なゲッター
    const typedGetter: Getter<T> = () => get() as T;
    
    // スライスを生成
    return sliceCreator(immerSetter, typedGetter, api);
  };
} 