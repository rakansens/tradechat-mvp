// store/chat/index.ts
// 初期実装: チャットスライスのエントリーポイント

import { ChatSliceState, initialChatState } from './state'
import { ChatSliceActions, createChatActions } from './actions'

// チャットスライスの完全な型
export type ChatSlice = ChatSliceState & ChatSliceActions

// チャットスライスの作成関数
export const createChatSlice = (
  set: (fn: (state: ChatSliceState) => void) => void,
  get: () => ChatSliceState
): ChatSlice => {
  // アクションを作成
  const actions = createChatActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialChatState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 