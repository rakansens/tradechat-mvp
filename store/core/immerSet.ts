// store/core/immerSet.ts
// 作成: 2025-10-06 - 型安全なImmer状態更新ラッパー関数

import { produce } from 'immer'
import type { Draft } from 'immer'
import type { MutateDraft } from '@/types/store/core'

/**
 * 型安全なImmerセッター関数を作成
 * Zustandのsetと組み合わせて使用するためのユーティリティ
 * 
 * @template TState 更新する状態の型
 * @param set Zustandのset関数
 * @returns ImmerのDraftを受け取って状態を更新する関数
 */
export const createImmerSetter = <TState>(
  set: (fn: (state: TState) => TState) => void
) => {
  return (fn: MutateDraft<TState>) => {
    set(state => produce(state, draft => {
      fn(draft as Draft<TState>)
    }))
  }
}

/**
 * 型安全なImmerセッター関数（単純版）
 * createImmerSetterのラッパー関数として使用
 * 
 * @template TState 更新する状態の型
 * @param fn イミュータブルな状態を変更する関数
 * @param set Zustandのset関数
 */
export const immerSet = <TState>(
  fn: MutateDraft<TState>,
  set: (fn: (state: TState) => TState) => void
) => {
  return createImmerSetter<TState>(set)(fn)
}

/**
 * 型安全なオブジェクトのプロパティ設定関数
 * Immerを使用してオブジェクトの特定プロパティを更新
 * 
 * @template TState 更新する状態の型
 * @template K 更新するプロパティのキー
 * @param key 更新するプロパティ名
 * @param value 新しい値
 * @returns Immerの状態更新関数
 */
export const setProperty = <TState, K extends keyof TState>(
  key: K,
  value: TState[K]
): MutateDraft<TState> => {
  return (draft) => {
    (draft as Record<K, TState[K]>)[key] = value
  }
}

/**
 * ネストしたプロパティの安全な更新
 * パス配列を使用してネストされたプロパティにアクセス
 * 
 * @template TState 更新する状態の型
 * @template Value 設定する値の型
 * @param path プロパティへのパス（文字列の配列）
 * @param value 設定する値
 * @returns Immerの状態更新関数
 */
export const setNestedProperty = <TState, Value>(
  path: string[],
  value: Value
): MutateDraft<TState> => {
  return (draft) => {
    let current: any = draft
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }
    current[path[path.length - 1]] = value
  }
}

export default createImmerSetter 

// createImmerSetter のエイリアス（呼び出し元の互換用）
export const createImmerSetterWithReturn = createImmerSetter;