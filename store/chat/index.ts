// store/chat/index.ts
// 初期実装: チャットスライスのエントリーポイント

import { ChatSliceState, initialChatState } from './state'
import { ChatSliceActions, createChatActions } from './actions'
import { createSlice } from '@/store/core/createSlice'

// チャットスライスの完全な型
export type ChatSlice = ChatSliceState & ChatSliceActions

// チャットスライスの作成関数
export const createChatSlice = createSlice<ChatSliceState, ChatSliceActions>(
  (set, get) => {
    const actions = createChatActions(set, get)
    return {
      ...initialChatState,
      ...actions
    }
  }
)

// メモ化されたセレクターのエクスポート
export * from './selectors' 