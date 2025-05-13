// store/core/loggerMiddleware.ts
// 初期実装: 状態変更をログに記録するZustandミドルウェア

import { StateCreator, StoreMutatorIdentifier } from 'zustand'

// ロガーミドルウェアの型定義
type Logger = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

type LoggerImpl = <T extends object>(
  f: StateCreator<T, [], []>,
  name?: string
) => StateCreator<T, [], []>

/**
 * 状態変更をコンソールにログ出力するミドルウェア
 * 開発環境で状態変更をトラッキングするために使用
 */
export const loggerMiddleware: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet = (args: any) => {
    // 開発環境でのみログを出力
    if (process.env.NODE_ENV === 'development') {
      console.group(`[Store${name ? ` (${name})` : ''}]: State update`)
      console.log('Prev State:', get())
      console.log('Args:', args)
    }
    
    const result = set(args)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Next State:', get())
      console.groupEnd()
    }
    
    return result
  }
  
  return f(loggedSet, get, store)
}

// 型に関する互換性を保証するための拡張
export const logger = loggerMiddleware as unknown as Logger 