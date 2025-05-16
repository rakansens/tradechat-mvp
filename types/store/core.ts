// types/store/core.ts
// 作成: 2025-10-04 - スライスクリエーターやストア操作のための共通型定義

import type { StateCreator, StoreApi } from 'zustand'
import type { Draft } from 'immer'

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