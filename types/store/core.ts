// types/store/core.ts
// 作成: 2025-10-04 - スライスクリエーターやストア操作のための共通型定義
// 更新: 2025-10-06 - MutateDraft/SliceCreator型の拡張と標準化

import type { StateCreator, StoreApi } from 'zustand'
import type { Draft } from 'immer'
import type { PersistOptions } from 'zustand/middleware/persist'

/**
 * スライスの状態を変更するためのImmer Draft関数型
 * Immerのdraftオブジェクトを直接変更できます
 * 
 * @template TState 状態の型
 */
export type MutateDraft<TState> = (draft: Draft<TState>) => void

/**
 * スライスクリエーター型定義
 * 各スライスのクリエーター関数の型を統一するために使用します
 * 
 * @template TSlice スライスの型（State & Actions）
 * @template TState 状態の型（Stateのみ）
 */
export type SliceCreator<TSlice, TState = any> = (
  set: (partial: Partial<TState> | ((state: TState) => Partial<TState> | TState | void)) => void,
  get: () => any,
  api?: StoreApi<any>
) => TSlice

/**
 * Immerを使用した状態変更関数の型
 * draft（イミュータブルな状態のコピー）を受け取り変更するコールバック関数
 * 
 * @template TState 状態の型
 */
export type ImmerStateSetter<TState> = (draft: Draft<TState>) => void

/**
 * Immerラッパー関数の型
 * TStateタイプのDraftを受け取る関数を使って状態を更新する
 * 
 * @template TState 状態の型
 */
export type ImmerSetFunction<TState> = (fn: ImmerStateSetter<TState>) => void 

/**
 * 型安全なゲッター関数の型
 * 
 * @template TState 取得する状態の型
 * @returns TState型の状態を返す関数
 */
export type TypedGetState<TState> = () => TState

/**
 * 永続化設定付きスライスクリエーターの型
 * 
 * @template TState スライスの状態型
 * @template TActions スライスのアクション型
 */
export type PersistedSliceCreator<TState, TActions = any> = (
  options: {
    name: string;
    initialState: TState;
    persistOptions?: Partial<PersistOptions<TState>>;
  }
) => StateCreator<TState & TActions, [], []>

/**
 * スライス型の基本構造
 * State + Actions パターンを標準化します
 * 
 * @template TState 状態の型
 * @template TActions アクションの型
 */
export interface Slice<TState, TActions> {
  state: TState;
  actions: TActions;
}

/**
 * RootStoreでの使用のためにSliceをマージする型
 * 
 * @template TState 状態の型
 * @template TActions アクションの型
 */
export type MergedSlice<TState, TActions> = TState & TActions; 