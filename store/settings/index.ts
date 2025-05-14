// store/settings/index.ts
// ユーザー設定管理ストア
// 作成日: 2025/6/2
// 更新日: 2025/6/X - 設定ストアのリファクタリングにより、他のストアと同じ構造に変更

import { SettingsSlice } from './types'
import { initialSettingsState } from './state'
import { createSettingsActions } from './actions'

// 設定ストアのスライス作成関数
export const createSettingsSlice = (
  set: (fn: (state: any) => void) => void,
  get: () => any
): SettingsSlice => {
  // アクションを作成
  const actions = createSettingsActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialSettingsState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors'
export * from './types'
