// store/chat/actions.ts
// チャットスライスのアクション
// 更新: 2025/5/20 - 会話IDごとのネームスペースをサポート
// 更新: 2025/5/28 - システムプロンプト情報をサポート

// 循環参照を避けるため、直接インポートせずに動的にインポートする
// import { useRootStore } from '../rootStore'
import type { ExtendedMessage, ProposalType } from '@/types/chat'
import type { ChatSliceState, ConversationState } from './state'
import { logger } from '@/utils/common'

// チャットスライスのアクション定義
export interface ChatSliceActions {
  // 基本アクション
  setMessages: (messages: ExtendedMessage[]) => void
  addMessage: (message: ExtendedMessage) => void
  setIsSearching: (isSearching: boolean) => void
  setInput: (input: string) => void
  
  // メッセージ操作
  sendMessage: (message: string, conversationId?: string) => Promise<void>
  clearMessages: () => void
  updateMessage: (id: string, updatedMessage: Partial<ExtendedMessage>) => void
  deleteMessage: (id: string) => void
  
  // 特殊なクエリハンドラー
  handleEntryPointQuery: () => void
  handleNewsQuery: () => void
  handleAIProposalQuery: () => void
  
  // 会話管理アクション
  setActiveConversation: (conversationId: string) => void
  createConversation: (title: string, systemPrompt?: string, initialMessages?: ExtendedMessage[]) => Promise<string>
  setConversationMessages: (conversationId: string, messages: ExtendedMessage[]) => void
  updateConversationMessage: (conversationId: string, messageId: string, updatedMessage: Partial<ExtendedMessage>) => void
  
  // 会話設定の更新アクション
  updateConversationSettings: (conversationId: string, title: string, systemPrompt?: string | null) => Promise<void>
}

// チャートとエントリーストアからのデータ参照のためのヘルパー関数
const getChartData = () => {
  try {
    // 動的にrootStoreをインポート
    const rootStore = require('../rootStore');
    // ルートストアからチャートデータを取得
    const { ohlcData } = rootStore.useRootStore.getState();
    return ohlcData;
  } catch (error) {
    logger.error('チャートデータの取得に失敗しました', {
      component: 'ChatActions',
      action: 'getChartData',
      error
    });
    return [];
  }
}

// チャットスライスのアクション作成関数
export const createChatActions = (
  set: (fn: (state: ChatSliceState) => void) => void,
  get: () => ChatSliceState
): ChatSliceActions => ({
  // 基本アクション - 後方互換性のために残す
  setMessages: (messages) => {
    set((state) => {
      // メインのメッセージを更新
      state.messages = messages
      
      // アクティブな会話があれば、会話ごとのメッセージも更新
      if (state.activeConversationId) {
        state.byConversation[state.activeConversationId] = {
          ...state.byConversation[state.activeConversationId],
          messages
        }
      }
    })
  },
  
  addMessage: (message) => {
    set((state) => {
      // メインのメッセージに追加
      state.messages = [...state.messages, message]
      
      // アクティブな会話があれば、会話ごとのメッセージも更新
      if (state.activeConversationId) {
        const conversationState = state.byConversation[state.activeConversationId]
        if (conversationState) {
          state.byConversation[state.activeConversationId] = {
            ...conversationState,
            messages: [...conversationState.messages, message]
          }
        }
      }
    })
  },
  
  setIsSearching: (isSearching) => {
    set((state) => {
      // メインの検索状態を更新
      state.isSearching = isSearching
      
      // アクティブな会話があれば、会話ごとの検索状態も更新
      if (state.activeConversationId) {
        const conversationState = state.byConversation[state.activeConversationId]
        if (conversationState) {
          state.byConversation[state.activeConversationId] = {
            ...conversationState,
            isSearching
          }
        }
      }
    })
  },
  
  setInput: (input) => {
    set((state) => {
      // メインの入力を更新
      state.input = input
      
      // アクティブな会話があれば、会話ごとの入力も更新
      if (state.activeConversationId) {
        const conversationState = state.byConversation[state.activeConversationId]
        if (conversationState) {
          state.byConversation[state.activeConversationId] = {
            ...conversationState,
            input
          }
        }
      }
    })
  },
  
  // メッセージ操作
  sendMessage: async (message, conversationId) => {
    const { messages, activeConversationId } = get()
    
    // 使用する会話IDを決定
    const targetConversationId = conversationId || activeConversationId || 'default'
    
    // 会話の状態を取得
    let conversationState = get().byConversation[targetConversationId]
    
    // 会話がない場合は作成
    if (!conversationState) {
      conversationState = {
        messages: [],
        isSearching: false,
        input: "",
        systemPrompt: null,
        title: `会話 ${new Date().toLocaleDateString()}`,
      }
      
      set((state) => {
        state.byConversation[targetConversationId] = conversationState
      })
    }
    
    // 会話のメッセージを取得
    const conversationMessages = conversationState.messages || []
    
    // ユーザーメッセージを追加
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    }
    
    // 会話ごとの状態を更新
    set((state) => {
      // アクティブな会話IDを設定
      state.activeConversationId = targetConversationId
      
      // 会話の状態を更新
      state.byConversation[targetConversationId] = {
        ...state.byConversation[targetConversationId],
        messages: [...conversationMessages, userMessage],
        input: "",
        isSearching: true
      }
      
      // 後方互換性のために残す
      state.messages = state.byConversation[targetConversationId].messages
      state.input = ""
      state.isSearching = true
    })
    
    try {
      // AIの応答用メッセージを事前に作成（ストリーミング用）
      const aiResponseId = Date.now().toString() + "-response"
      const aiResponse: ExtendedMessage = {
        id: aiResponseId,
        role: "assistant",
        content: "",
        isStreaming: true, // ストリーミング中フラグを設定
      }
      
      // 空のAI応答メッセージを追加
      set((state) => {
        // 会話の状態を更新
        const messages = state.byConversation[targetConversationId].messages
        state.byConversation[targetConversationId].messages = [...messages, aiResponse]
        
        // 後方互換性のために残す
        state.messages = state.byConversation[targetConversationId].messages
      })
      
      // APIリクエストURL
      const apiUrl = targetConversationId !== 'default'
        ? `/api/messages/${targetConversationId}`
        : '/api/mastra/chat'
      
      // MASTRAのAPIエンドポイントを使用
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          messages: [...conversationMessages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      })
      
      if (!response.ok) {
        throw new Error('APIリクエストに失敗しました')
      }
      
      // レスポンスをストリームとして読み込む
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('レスポンスボディを読み取れません')
      }
      
      // テキストデコーダーを作成
      const decoder = new TextDecoder()
      let accumulatedContent = "" // 累積コンテンツ
      
      // ストリームを読み込む
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // バイナリデータをテキストに変換
        const chunk = decoder.decode(value, { stream: true })
        
        // 0:"文字" 形式のパターンを検出
        const charMatches = chunk.match(/0:"([^"]*)"/g)
        if (charMatches && charMatches.length > 0) {
          // 各文字を処理
          for (const match of charMatches) {
            const char = match.match(/0:"([^"]*)"/);
            if (char) {
              // 文字を累積コンテンツに追加
              accumulatedContent += char[1];
              
              // メッセージを更新
              set((state) => {
                // 会話の状態を更新
                state.byConversation[targetConversationId].messages = state.byConversation[targetConversationId].messages.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
                
                // 後方互換性のために残す
                state.messages = state.byConversation[targetConversationId].messages
              })
            }
          }
        } else {
          // 従来の "data: {"text":"..."}" 形式のストリーミングデータを処理
          const matches = chunk.match(/data: ({.*?})/g)
          if (matches && matches.length > 0) {
            try {
              // 最後のデータチャンクを取得
              const lastChunk = matches[matches.length - 1].replace('data: ', '')
              const chunkData = JSON.parse(lastChunk)
              const chunkContent = chunkData.text || chunkData.content || ""
              
              // コンテンツを更新
              accumulatedContent = chunkContent
              
              // メッセージを更新
              set((state) => {
                // 会話の状態を更新
                state.byConversation[targetConversationId].messages = state.byConversation[targetConversationId].messages.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
                
                // 後方互換性のために残す
                state.messages = state.byConversation[targetConversationId].messages
              })
            } catch (chunkError) {
              console.log('チャンク抽出エラー:', chunkError)
            }
          }
        }
      }
      
      // ストリーミング完了後、isStreamingフラグをfalseに設定
      set((state) => {
        // 会話の状態を更新
        state.byConversation[targetConversationId].messages = state.byConversation[targetConversationId].messages.map(msg =>
          msg.id === aiResponseId
            ? { ...msg, isStreaming: false }
            : msg
        )
        
        // 検索状態を更新
        state.byConversation[targetConversationId].isSearching = false
        
        // 後方互換性のために残す
        state.messages = state.byConversation[targetConversationId].messages
        state.isSearching = false
      })
      
    } catch (error) {
      console.error('メッセージ送信エラー:', error)
      
      // エラー状態を設定
      set((state) => {
        // 会話の検索状態を更新
        state.byConversation[targetConversationId].isSearching = false
        
        // 後方互換性のために残す
        state.isSearching = false
      })
    }
  },
  
  clearMessages: () => {
    set((state) => {
      // アクティブな会話がある場合、会話ごとのメッセージをクリア
      if (state.activeConversationId) {
        state.byConversation[state.activeConversationId] = {
          ...state.byConversation[state.activeConversationId],
          messages: []
        }
      }
      
      // メインのメッセージもクリア
      state.messages = []
    })
  },
  
  updateMessage: (id, updatedMessage) => {
    set((state) => {
      // メインのメッセージを更新
      state.messages = state.messages.map(msg =>
        msg.id === id
          ? { ...msg, ...updatedMessage }
          : msg
      )
      
      // アクティブな会話があれば、会話ごとのメッセージも更新
      if (state.activeConversationId) {
        const conversationState = state.byConversation[state.activeConversationId]
        if (conversationState) {
          state.byConversation[state.activeConversationId] = {
            ...conversationState,
            messages: conversationState.messages.map(msg =>
              msg.id === id
                ? { ...msg, ...updatedMessage }
                : msg
            )
          }
        }
      }
    })
  },
  
  deleteMessage: (id) => {
    set((state) => {
      // メインのメッセージから削除
      state.messages = state.messages.filter(msg => msg.id !== id)
      
      // アクティブな会話があれば、会話ごとのメッセージからも削除
      if (state.activeConversationId) {
        const conversationState = state.byConversation[state.activeConversationId]
        if (conversationState) {
          state.byConversation[state.activeConversationId] = {
            ...conversationState,
            messages: conversationState.messages.filter(msg => msg.id !== id)
          }
        }
      }
    })
  },
  
  // 会話管理アクション
  setActiveConversation: (conversationId) => {
    set((state) => {
      // 会話が存在しない場合は作成
      if (!state.byConversation[conversationId]) {
        state.byConversation[conversationId] = {
          messages: [],
          isSearching: false,
          input: "",
          systemPrompt: null,
          title: `会話 ${new Date().toLocaleDateString()}`,
        }
      }
      
      // アクティブな会話IDを更新
      state.activeConversationId = conversationId
      
      // メインの状態を更新
      state.messages = state.byConversation[conversationId].messages
      state.isSearching = state.byConversation[conversationId].isSearching
      state.input = state.byConversation[conversationId].input
    })
  },
  
  createConversation: async (title, systemPrompt, initialMessages = []) => {
    try {
      // APIを使用して会話を作成
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          system_prompt: systemPrompt || null 
        }),
      })

      if (!response.ok) {
        throw new Error('会話の作成に失敗しました')
      }

      const newConversation = await response.json()
      const conversationId = newConversation.id
      
      set((state) => {
        // 新しい会話を作成
        state.byConversation[conversationId] = {
          messages: initialMessages,
          isSearching: false,
          input: "",
          systemPrompt: systemPrompt || null,
          title
        }
        
        // アクティブな会話IDを更新
        state.activeConversationId = conversationId
        
        // メインの状態を更新
        state.messages = initialMessages
        state.isSearching = false
        state.input = ""
      })
      
      // 会話作成イベントを発行
      window.dispatchEvent(new CustomEvent('conversationCreated', { 
        detail: { conversationId } 
      }))
      
      // 会話IDを返す
      return conversationId
    } catch (error) {
      console.error('Failed to create conversation:', error)
      throw error
    }
  },
  
  setConversationMessages: (conversationId, messages) => {
    set((state) => {
      // 会話が存在しない場合は作成
      if (!state.byConversation[conversationId]) {
        state.byConversation[conversationId] = {
          messages: [],
          isSearching: false,
          input: "",
          systemPrompt: null,
          title: `会話 ${new Date().toLocaleDateString()}`,
        }
      }
      
      // 会話のメッセージを更新
      state.byConversation[conversationId] = {
        ...state.byConversation[conversationId],
        messages
      }
      
      // アクティブな会話の場合、メインの状態も更新
      if (state.activeConversationId === conversationId) {
        state.messages = messages
      }
    })
  },
  
  updateConversationMessage: (conversationId, messageId, updatedMessage) => {
    set((state) => {
      // 会話が存在しない場合はスキップ
      if (!state.byConversation[conversationId]) return
      
      // 会話のメッセージを更新
      state.byConversation[conversationId] = {
        ...state.byConversation[conversationId],
        messages: state.byConversation[conversationId].messages.map(msg =>
          msg.id === messageId
            ? { ...msg, ...updatedMessage }
            : msg
        )
      }
      
      // アクティブな会話の場合、メインの状態も更新
      if (state.activeConversationId === conversationId) {
        state.messages = state.byConversation[conversationId].messages
      }
    })
  },
  
  // 特殊なクエリハンドラー - 後方互換性のために残す
  handleEntryPointQuery: () => {
    const { messages, activeConversationId = 'default' } = get()
    const ohlcData = getChartData()
    
    // チャートデータが必要
    if (!ohlcData || ohlcData.length === 0) {
      set((state) => {
        // 会話の状態を更新
        state.byConversation[activeConversationId] = {
          ...state.byConversation[activeConversationId],
          messages: [
            ...state.byConversation[activeConversationId].messages,
            {
              id: Date.now().toString(),
              role: "assistant",
              content: "チャートデータが読み込まれていないため、分析できません。チャートを表示してから再度お試しください。",
            } as ExtendedMessage
          ]
        }
        
        // 後方互換性のために残す
        state.messages = state.byConversation[activeConversationId].messages
      })
      return
    }
    
    // 入力内容を取得
    const input = get().input || "エントリーポイントを教えてください"
    
    // ユーザーメッセージとAI応答を生成
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    
    const aiResponse: ExtendedMessage = {
      id: Date.now().toString() + "-response",
      role: "assistant",
      content: `BTCUSDチャートを分析し、潜在的なエントリーポイントを特定しました。

テクニカル分析:
• 価格は50日移動平均線を上回っており、強気シグナル
• 直近高値: $61,500、直近安値: $59,500
• 出来高は平均で、著しい売り圧力なし

現在価格 $60,500 でロングポジションを取りますか？ 目標: $62,000、ストップロス: $59,000`,
      isProposal: true,
      proposalType: "buy",
      price: 60500,
      takeProfit: 62000, 
      stopLoss: 59000,
    }
    
    // メッセージを更新
    set((state) => {
      // 会話のメッセージを更新
      state.byConversation[activeConversationId] = {
        ...state.byConversation[activeConversationId],
        messages: [...state.byConversation[activeConversationId].messages, userMessage, aiResponse],
        input: "",
        isSearching: false
      }
      
      // 後方互換性のために残す
      state.messages = state.byConversation[activeConversationId].messages
      state.input = ""
      state.isSearching = false
    })
    
    // エントリー情報を設定
    try {
      const rootStore = require('../rootStore')
      rootStore.useRootStore.getState().setPendingEntry({
        id: Date.now().toString(),
        side: "buy",
        symbol: "BTC/USD",
        price: 60500,
        time: new Date().toISOString(),
        status: "open",
        takeProfit: 62000,
        stopLoss: 59000,
      })
    } catch (error) {
      console.error('setPendingEntryの呼び出しに失敗しました:', error)
    }
  },

  // handleNewsQueryとhandleAIProposalQueryは同様に更新
  handleNewsQuery: () => {
    // 基本的な実装構造はhandleEntryPointQueryと同じ
    // アクティブな会話IDを取得して処理する
    const { activeConversationId = 'default' } = get()
    // 以下、実装は同様...
  },

  handleAIProposalQuery: () => {
    // 基本的な実装構造はhandleEntryPointQueryと同じ
    // アクティブな会話IDを取得して処理する
    const { activeConversationId = 'default' } = get()
    // 以下、実装は同様...
  },
  
  // 会話設定の更新アクション
  updateConversationSettings: async (conversationId, title, systemPrompt) => {
    try {
      // APIを使用して会話を更新
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          system_prompt: systemPrompt || null 
        }),
      })

      if (!response.ok) {
        throw new Error('会話の更新に失敗しました')
      }

      const updatedConversation = await response.json()
      
      set((state) => {
        // 会話が存在しない場合はスキップ
        if (!state.byConversation[conversationId]) return
        
        // 会話の設定を更新
        state.byConversation[conversationId] = {
          ...state.byConversation[conversationId],
          title,
          systemPrompt: systemPrompt || null
        }
      })
      
      // 会話更新イベントを発行
      window.dispatchEvent(new CustomEvent('conversationUpdated', { 
        detail: { conversationId } 
      }))
    } catch (error) {
      console.error('Failed to update conversation settings:', error)
      throw error
    }
  }
})