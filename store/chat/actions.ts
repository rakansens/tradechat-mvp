// store/chat/actions.ts
// 初期実装: チャットスライスのアクション

import { useRootStore } from '../rootStore'
import type { ExtendedMessage, ProposalType } from '@/types/chat'
import type { ChatSliceState } from './state'

// チャットスライスのアクション定義
export interface ChatSliceActions {
  // 基本アクション
  setMessages: (messages: ExtendedMessage[]) => void
  addMessage: (message: ExtendedMessage) => void
  setIsSearching: (isSearching: boolean) => void
  setInput: (input: string) => void
  
  // メッセージ操作
  sendMessage: (message: string) => Promise<void>
  clearMessages: () => void
  updateMessage: (id: string, updatedMessage: Partial<ExtendedMessage>) => void
  deleteMessage: (id: string) => void
  
  // 特殊なクエリハンドラー
  handleEntryPointQuery: () => void
  handleNewsQuery: () => void
  handleAIProposalQuery: () => void
}

// チャートとエントリーストアからのデータ参照のためのヘルパー関数
const getChartData = () => {
  // ルートストアからチャートデータを取得
  const { ohlcData } = useRootStore.getState()
  return ohlcData
}

// チャットスライスのアクション作成関数
export const createChatActions = (
  set: (fn: (state: ChatSliceState) => void) => void,
  get: () => ChatSliceState
): ChatSliceActions => ({
  // 基本アクション
  setMessages: (messages) => {
    set((state) => {
      state.messages = messages
    })
  },
  
  addMessage: (message) => {
    set((state) => {
      state.messages = [...state.messages, message]
    })
  },
  
  setIsSearching: (isSearching) => {
    set((state) => {
      state.isSearching = isSearching
    })
  },
  
  setInput: (input) => {
    set((state) => {
      state.input = input
    })
  },
  
  // メッセージ操作
  sendMessage: async (message) => {
    const { messages } = get()
    
    // ユーザーメッセージを追加
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
    }
    
    set((state) => {
      state.messages = [...state.messages, userMessage]
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
        state.messages = [...state.messages, aiResponse]
      })
      
      // MASTRAのAPIエンドポイントを使用
      const response = await fetch('/api/mastra/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
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
                state.messages = state.messages.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
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
                state.messages = state.messages.map(msg =>
                  msg.id === aiResponseId
                    ? { ...msg, content: accumulatedContent }
                    : msg
                )
              })
            } catch (chunkError) {
              console.log('チャンク抽出エラー:', chunkError)
            }
          }
        }
      }
      
      // ストリーミング完了後、isStreamingフラグをfalseに設定
      set((state) => {
        state.messages = state.messages.map(msg =>
          msg.id === aiResponseId
            ? { ...msg, isStreaming: false }
            : msg
        )
        state.isSearching = false
      })
      
      // AIの応答からコンテンツを取得
      const aiResponseContent = get().messages.find(msg => msg.id === aiResponseId)?.content || ""
      
      // エントリーポイントの提案を検出
      if (aiResponseContent.includes("enter") || 
          aiResponseContent.includes("position") || 
          aiResponseContent.includes("buy") || 
          aiResponseContent.includes("sell")) {
        
        // 価格を抽出
        const priceMatch = aiResponseContent.match(/\$(\d+,?\d*)/);
        const price = priceMatch
          ? Number.parseFloat(priceMatch[1].replace(",", ""))
          : 60500; // デフォルト価格
        
        // 買いか売りかを判断
        const isBuy = !aiResponseContent.includes("sell") && !aiResponseContent.includes("short");
        
        // エントリーストアのアクションを呼び出し
        useRootStore.getState().setPendingEntry({
          id: Date.now().toString(),
          side: isBuy ? "buy" : "sell",
          symbol: "BTC/USD",
          price: price,
          time: new Date().toISOString(),
          status: "open",
        })
      }
      
    } catch (error) {
      console.error('チャットAPIエラー:', error)
      
      // エラー時のフォールバック応答
      const errorResponse: ExtendedMessage = {
        id: Date.now().toString() + "-error",
        role: "assistant",
        content: "申し訳ありませんが、応答の生成中にエラーが発生しました。もう一度お試しください。",
        isStreaming: false,
      }
      
      set((state) => {
        state.messages = [...state.messages, errorResponse]
        state.isSearching = false
      })
    }
  },
  
  clearMessages: () => {
    const { messages } = get()
    // ウェルカムメッセージのみ残す
    const welcomeMessage = messages.find(msg => msg.id === "welcome")
    
    set((state) => {
      state.messages = welcomeMessage ? [welcomeMessage] : []
    })
  },
  
  updateMessage: (id, updatedMessage) => {
    set((state) => {
      state.messages = state.messages.map(msg => 
        msg.id === id ? { ...msg, ...updatedMessage } : msg
      )
    })
  },
  
  deleteMessage: (id) => {
    set((state) => {
      state.messages = state.messages.filter(msg => msg.id !== id)
    })
  },
  
  // 特殊なクエリハンドラー
  handleEntryPointQuery: () => {
    const { messages } = get()
    // チャートデータを取得
    const data = getChartData()
    const currentPrice = data[data.length - 1].close
    
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "Entry Point",
    }
    
    const aiResponse: ExtendedMessage = {
      id: Date.now().toString() + "-response",
      role: "assistant",
      content: `Based on my analysis of the current chart, Bitcoin is in a short-term uptrend.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $${(currentPrice * 1.02).toFixed(0)}, recent low: $${(currentPrice * 0.98).toFixed(0)}
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $${currentPrice.toLocaleString()}? Target: $${(currentPrice * 1.05).toFixed(0)}, Stop loss: $${(currentPrice * 0.98).toFixed(0)}.`,
      isProposal: true,
      proposalType: "buy",
      price: currentPrice,
    }
    
    // エントリーストアのアクションを呼び出し
    useRootStore.getState().setPendingEntry({
      id: Date.now().toString(),
      side: "buy",
      symbol: "BTC/USD",
      price: currentPrice,
      time: new Date().toISOString(),
      status: "open",
    })
    
    set((state) => {
      state.messages = [...state.messages, userMessage, aiResponse]
    })
  },
  
  handleNewsQuery: () => {
    const { messages } = get()

    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "Market News",
    }
    
    set((state) => {
      state.isSearching = true
    })

    // ニュース取得のシミュレーション（API遅延）
    setTimeout(() => {
      const aiResponse: ExtendedMessage = {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: `Here's the latest Bitcoin market news:

1. Bitcoin price has risen 5% in the last 24 hours, currently trading around $61,200.
2. U.S. regulators are considering a new regulatory framework for crypto assets.
3. Major institutional investors have increased their Bitcoin positions.
4. Technical analysis shows Bitcoin trading above its 50-day moving average, indicating a bullish signal.
5. Market volatility has decreased by 20% compared to last week.

Based on these developments, the short-term trend appears bullish, but watch for regulatory news that could impact the market.`,
      }

      set((state) => {
        state.messages = [...state.messages, userMessage, aiResponse]
        state.isSearching = false
      })
    }, 1500)
  },
  
  handleAIProposalQuery: () => {
    const { messages } = get()
    // チャートデータを取得
    const data = getChartData()
    const currentPrice = data[data.length - 1].close
    const randomPrice = Math.floor(currentPrice * (0.98 + Math.random() * 0.04))
    const isBuy = Math.random() > 0.5
    
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      role: "user",
      content: "AI Signal",
    }
    
    set((state) => {
      state.isSearching = true
    })
    
    // シグナル生成のシミュレーション（API遅延）
    setTimeout(() => {
      const aiResponse: ExtendedMessage = {
        id: Date.now().toString() + "-proposal",
        role: "assistant",
        content: `I've detected a ${isBuy ? "BUY" : "SELL"} signal!

Technical Analysis:
• ${isBuy ? "Uptrend forming" : "Downtrend forming"}
• ${isBuy ? "RSI rising but not yet overbought" : "RSI falling but not yet oversold"}
• ${isBuy ? "Price bouncing off support level" : "Price rejecting at resistance level"}

Would you like to enter a ${isBuy ? "long" : "short"} position at the current price of $${randomPrice.toLocaleString()}?`,
        isProposal: true,
        proposalType: isBuy ? "buy" : "sell",
        price: randomPrice,
      }
      
      // エントリーストアのアクションを呼び出し
      useRootStore.getState().setPendingEntry({
        id: Date.now().toString(),
        side: isBuy ? "buy" : "sell",
        symbol: "BTC/USD",
        price: randomPrice,
        time: new Date().toISOString(),
        status: "open",
      })
      
      set((state) => {
        state.messages = [...state.messages, userMessage, aiResponse]
        state.isSearching = false
      })
    }, 1000)
  },
})