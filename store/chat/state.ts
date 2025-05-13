// store/chat/state.ts
// 初期実装: チャットスライスの状態と初期値を定義

import type { ExtendedMessage } from '@/types/chat'

// チャットスライスの状態インターフェース
export interface ChatSliceState {
  messages: ExtendedMessage[]
  isSearching: boolean
  input: string
}

// 初期メッセージの設定
const initialMessages: ExtendedMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Welcome to AlphaTrader! I'm your AI trading assistant. How can I help you analyze the market today?",
  },
  {
    id: "ai-proposal-1",
    role: "assistant",
    content: `I've analyzed the Bitcoin chart and detected a potential buy signal.

Technical Analysis:
• Price has broken above the 50-day moving average
• Recent higher highs and higher lows
• Volume is trending upward

Would you like to enter a long position at the current price of $60,500?`,
    isProposal: true,
    proposalType: "buy",
    price: 60500,
  },
]

// チャットスライスの初期状態
export const initialChatState: ChatSliceState = {
  messages: initialMessages,
  isSearching: false,
  input: "",
} 