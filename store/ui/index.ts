// store/ui/index.ts
// 初期実装: UIスライスのエントリーポイント

import { UISliceState, initialUIState } from './state'
import { UISliceActions, createUIActions } from './actions'

// UIスライスの完全な型
export type UISlice = UISliceState & UISliceActions

// UIスライスの作成関数
export const createUISlice = (
  set: (fn: (state: UISliceState) => void) => void,
  get: () => UISliceState
): UISlice => {
  // アクションを作成
  const actions = createUIActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialUIState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 