// store/core/createSlice.ts
// 共通のスライス作成ヘルパー
// Zustandのset/get関数を型安全にラップし、Immerを利用した更新を提供します

import { immer } from 'zustand/middleware/immer'

// スライス依存のないシンプルなセッター型
type Setter<T> = (fn: (state: T) => void) => void

// スライス依存のないシンプルなゲッター型
type Getter<T> = () => T

/**
 * スライス作成ヘルパー
 * 各スライスのエントリーファイルから呼び出し、
 * set/getを型安全に扱えるようにします。
 */
export function createSlice<T extends object, U extends object = {}>(
  sliceCreator: (set: Setter<T>, get: Getter<T>, api?: any) => T & U
) {
  return (set: any, get: any, api: any) => {
    // Immer ラッパーを提供
    const immerSetter: Setter<T> = (fn) => {
      set(
        immer((state: any) => {
          fn(state)
        })
      )
    }

    // 型安全なゲッター
    const typedGetter: Getter<T> = () => get() as T

    // スライスを生成
    return sliceCreator(immerSetter, typedGetter, api)
  }
}

export type { Setter, Getter }

