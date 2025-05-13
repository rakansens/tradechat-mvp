// store/entry/index.ts
// 初期実装: エントリースライスのエントリーポイント

import { EntrySliceState, initialEntryState } from './state'
import { EntrySliceActions, createEntryActions } from './actions'

// エントリースライスの完全な型
export type EntrySlice = EntrySliceState & EntrySliceActions

// エントリースライスの作成関数
export const createEntrySlice = (
  set: (fn: (state: EntrySliceState) => void) => void,
  get: () => EntrySliceState
): EntrySlice => {
  // アクションを作成
  const actions = createEntryActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialEntryState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 