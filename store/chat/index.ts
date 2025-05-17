// store/chat/index.ts
// 初期実装: チャットスライスのエントリーポイント

import { ChatSliceState, initialChatState } from './state'
import { ChatSliceActions, createChatActions, ChatActionDeps } from './actions'

// チャットスライスの完全な型
export type ChatSlice = ChatSliceState & ChatSliceActions

// チャットスライスの作成関数
export const createChatSlice = (
  set: (fn: (state: ChatSliceState) => void) => void,
  get: () => ChatSliceState,
  deps: ChatActionDeps
): ChatSlice => {
  // アクションを作成
  const actions = createChatActions(set, get, deps)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialChatState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 