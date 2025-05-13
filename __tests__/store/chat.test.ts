// __tests__/store/chat.test.ts
// チャットスライスのテスト

import { useRootStore } from '@/store/rootStore'
import { 
  selectMessages, 
  selectIsSearching, 
  selectInput,
  selectUserMessages,
  selectAIMessages,
  selectProposalMessages
} from '@/store/chat/selectors'
import type { ExtendedMessage } from '@/types/chat'

// モック用のヘルパー関数
const setupStore = () => {
  // テスト前にストアをリセット
  useRootStore.setState({
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Welcome to AlphaTrader!"
      }
    ],
    isSearching: false,
    input: ""
  })
}

// テスト用のモックメッセージ
const mockUserMessage: ExtendedMessage = {
  id: 'test-message-1',
  role: 'user',
  content: 'Test message content'
}

const mockAIMessage: ExtendedMessage = {
  id: 'test-message-2',
  role: 'assistant',
  content: 'AI response content'
}

const mockProposalMessage: ExtendedMessage = {
  id: 'test-proposal-1',
  role: 'assistant',
  content: 'Would you like to buy Bitcoin?',
  isProposal: true,
  proposalType: 'buy',
  price: 60000
}

describe('Chat Slice', () => {
  beforeEach(() => {
    setupStore()
    
    // fetch APIのモック
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        body: {
          getReader: () => ({
            read: () => Promise.resolve({ done: true, value: undefined })
          })
        }
      } as any)
    ) as jest.Mock
  })
  
  describe('Actions', () => {
    it('should set messages', () => {
      const messages = [mockUserMessage, mockAIMessage]
      useRootStore.getState().setMessages(messages)
      expect(useRootStore.getState().messages).toEqual(messages)
    })
    
    it('should add message', () => {
      useRootStore.getState().addMessage(mockUserMessage)
      expect(useRootStore.getState().messages.length).toBe(2)
      expect(useRootStore.getState().messages[1]).toEqual(mockUserMessage)
    })
    
    it('should set isSearching', () => {
      useRootStore.getState().setIsSearching(true)
      expect(useRootStore.getState().isSearching).toBe(true)
    })
    
    it('should set input', () => {
      const inputValue = 'Test input'
      useRootStore.getState().setInput(inputValue)
      expect(useRootStore.getState().input).toBe(inputValue)
    })
    
    it('should clear messages but keep welcome message', () => {
      // まずメッセージを追加
      useRootStore.getState().addMessage(mockUserMessage)
      useRootStore.getState().addMessage(mockAIMessage)
      expect(useRootStore.getState().messages.length).toBe(3)
      
      // メッセージをクリア
      useRootStore.getState().clearMessages()
      
      // ウェルカムメッセージだけが残るか確認
      const state = useRootStore.getState()
      expect(state.messages.length).toBe(1)
      expect(state.messages[0].id).toBe('welcome')
    })
    
    it('should update message', () => {
      // メッセージを追加
      useRootStore.getState().addMessage(mockUserMessage)
      
      // メッセージを更新
      const updatedContent = 'Updated content'
      useRootStore.getState().updateMessage(mockUserMessage.id, { content: updatedContent })
      
      // 更新されたかチェック
      const messages = useRootStore.getState().messages
      const updatedMessage = messages.find(msg => msg.id === mockUserMessage.id)
      expect(updatedMessage?.content).toBe(updatedContent)
    })
    
    it('should delete message', () => {
      // メッセージを追加
      useRootStore.getState().addMessage(mockUserMessage)
      expect(useRootStore.getState().messages.length).toBe(2)
      
      // メッセージを削除
      useRootStore.getState().deleteMessage(mockUserMessage.id)
      
      // 削除されたかチェック
      const messages = useRootStore.getState().messages
      expect(messages.length).toBe(1)
      expect(messages.find(msg => msg.id === mockUserMessage.id)).toBeUndefined()
    })
  })
  
  describe('Selectors', () => {
    beforeEach(() => {
      // テストデータをセットアップ
      useRootStore.setState({
        messages: [
          {
            id: "welcome",
            role: "assistant",
            content: "Welcome to AlphaTrader!"
          },
          mockUserMessage,
          mockAIMessage,
          mockProposalMessage
        ],
        isSearching: false,
        input: "test input"
      })
    })
    
    it('should select all messages', () => {
      const messages = selectMessages(useRootStore.getState())
      expect(messages.length).toBe(4)
    })
    
    it('should select isSearching state', () => {
      const isSearching = selectIsSearching(useRootStore.getState())
      expect(isSearching).toBe(false)
      
      useRootStore.getState().setIsSearching(true)
      
      const updatedIsSearching = selectIsSearching(useRootStore.getState())
      expect(updatedIsSearching).toBe(true)
    })
    
    it('should select input', () => {
      const input = selectInput(useRootStore.getState())
      expect(input).toBe("test input")
    })
    
    it('should select user messages only', () => {
      const userMessages = selectUserMessages(useRootStore.getState())
      expect(userMessages.length).toBe(1)
      expect(userMessages[0].role).toBe('user')
    })
    
    it('should select AI messages only', () => {
      const aiMessages = selectAIMessages(useRootStore.getState())
      expect(aiMessages.length).toBe(3)
      expect(aiMessages[0].role).toBe('assistant')
    })
    
    it('should select proposal messages only', () => {
      const proposalMessages = selectProposalMessages(useRootStore.getState())
      expect(proposalMessages.length).toBe(1)
      expect(proposalMessages[0].isProposal).toBe(true)
    })
  })
}) 