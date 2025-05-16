// store/core/immerSet.ts
// 作成: 2025-10-04 - Immer状態更新のためのヘルパー関数
// 役割: Immerを使った状態更新を簡潔に行うためのラッパー関数を提供

import type { Draft } from 'immer';
import { immer } from 'zustand/middleware/immer';
import { type ImmerStateSetter, type ImmerSetFunction } from '@/types/store/core';

/**
 * 状態を更新する型安全なImmerラッパー関数を作成
 * 
 * @template TState 状態の型
 * @param set Zustandのset関数
 * @returns 型安全なImmer状態更新関数
 */
export function createImmerSetter<TState>(
  set: (fn: (state: any) => any) => void
): ImmerSetFunction<TState> {
  return (fn: ImmerStateSetter<TState>) => {
    set((state) => {
      // 型キャストを使用して、stateをTStateとして扱う
      fn(state as unknown as Draft<TState>);
      // 変更されたstateはimmerによって自動的に生成される
      return state;
    });
  };
}

/**
 * 拡張されたImmer関数型
 * Immerのdraftオブジェクトを操作した後、明示的に部分的な状態を返す関数型
 * 
 * @template TState 状態の型
 */
export type ImmerStateSetterWithReturn<TState> = (draft: Draft<TState>) => Partial<TState>;

/**
 * 明示的な返り値を持つImmerラッパー関数を作成
 * 
 * @template TState 状態の型
 * @param set Zustandのset関数
 * @returns 明示的な返り値を持つImmer状態更新関数
 */
export function createImmerSetterWithReturn<TState>(
  set: (fn: (state: any) => any) => void
): (fn: ImmerStateSetterWithReturn<TState>) => void {
  return (fn: ImmerStateSetterWithReturn<TState>) => {
    set((state) => {
      // fn関数は部分的な状態を返す
      return fn(state as unknown as Draft<TState>);
    });
  };
} 