// store/useChatStore.ts
// 更新: 旧ストア設計との後方互換性のためのブリッジファイル
// 注意: このファイルは将来的に削除される予定です。新しい実装では useRootStore を使用してください。

import { useRootStore } from './rootStore'
import { useCallback } from 'react'
import type { ChatState, ExtendedMessage } from '@/types/chat'

/**
 * 後方互換性のためのチャットストアフック
 * @deprecated 新しい実装では useRootStore と barrel.ts からエクスポートされるセレクター関数を使用してください
 */
export const useChatStore = (() => {
  // ルートストアへのプロキシを作成
  const useStore = () => {
    const rootStore = useRootStore()
    
    // 状態と基本アクション
    const state = {
      messages: rootStore.messages,
      isSearching: rootStore.isSearching,
      input: rootStore.input,
      
      // メッセージ操作のアクション
      setMessages: rootStore.setMessages,
      addMessage: rootStore.addMessage,
      setIsSearching: rootStore.setIsSearching,
      setInput: rootStore.setInput,
      sendMessage: rootStore.sendMessage,
      clearMessages: rootStore.clearMessages,
      updateMessage: rootStore.updateMessage,
      deleteMessage: rootStore.deleteMessage,
      
      // 特殊なクエリハンドラー
      handleEntryPointQuery: rootStore.handleEntryPointQuery,
      handleNewsQuery: rootStore.handleNewsQuery,
      handleAIProposalQuery: rootStore.handleAIProposalQuery,
    }
    
    return state as ChatState
  }
  
  // Zustandのストアに近い動作をするオブジェクトを作成
  const result = useStore as unknown as {
    (): ChatState
    getState: () => ChatState
    setState: (partial: Partial<ChatState>) => void
  }
  
  // getState と setState メソッドを追加
  result.getState = () => {
    const rootState = useRootStore.getState()
    
    return {
      messages: rootState.messages,
      isSearching: rootState.isSearching,
      input: rootState.input,
      setMessages: rootState.setMessages,
      addMessage: rootState.addMessage,
      setIsSearching: rootState.setIsSearching,
      setInput: rootState.setInput,
      sendMessage: rootState.sendMessage,
      clearMessages: rootState.clearMessages,
      updateMessage: rootState.updateMessage,
      deleteMessage: rootState.deleteMessage,
      handleEntryPointQuery: rootState.handleEntryPointQuery,
      handleNewsQuery: rootState.handleNewsQuery,
      handleAIProposalQuery: rootState.handleAIProposalQuery,
    } as ChatState
  }
  
  result.setState = (partial) => {
    const state = useRootStore.getState()
    
    // 状態の更新
    if ('messages' in partial) {
      state.setMessages(partial.messages!)
    }
    if ('isSearching' in partial) {
      state.setIsSearching(partial.isSearching!)
    }
    if ('input' in partial) {
      state.setInput(partial.input!)
    }
  }
  
  return result
})()
