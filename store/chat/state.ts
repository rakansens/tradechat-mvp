// store/chat/state.ts
// チャットスライスの状態と初期値を定義
// 更新: 2025/5/20 - 会話IDごとのネームスペースをサポート
// 更新: 2025/5/28 - システムプロンプト情報をサポート
// 更新: 2025/6/2 - リアルタイム購読の接続状態とエラー管理フィールドを追加
// 更新: 2025/6/30 - インポートパスを修正（/types/chat → /types/chat/base）
// 更新: 2025/6/30 - インポートパスを相対パスに変更

import type { ExtendedMessage } from '@/types/chat'

// リアルタイム接続状態タイプ
export type ConnectionStatus = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR'
  | 'MAX_RETRIES_EXCEEDED';

// 会話状態インターフェース
export interface ConversationState {
  messages: ExtendedMessage[];
  isSearching: boolean;
  input: string;
  // システムプロンプト情報を追加
  systemPrompt?: string | null;
  title: string;
  // リアルタイム購読状態
  connectionStatus?: ConnectionStatus;
  connectionError?: string | null;
  lastMessageAt?: string | null;
}

// チャットスライスの状態インターフェース
export interface ChatSliceState {
  // 会話IDごとのメッセージを管理
  byConversation: Record<string, ConversationState>;
  // 後方互換性のためのフラットなメッセージリスト
  messages: ExtendedMessage[];
  isSearching: boolean;
  input: string;
  // 現在アクティブな会話ID
  activeConversationId: string | null;
  // リアルタイム購読状態
  messageSubscription: (() => void) | null;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
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
  // 会話IDごとのメッセージ管理 - 最初はデフォルト会話のみ
  byConversation: {
    'default': {
      messages: initialMessages,
      isSearching: false,
      input: "",
      systemPrompt: null,
      title: "Trading Assistant",
      connectionStatus: 'DISCONNECTED',
      connectionError: null,
      lastMessageAt: null
    }
  },
  // 後方互換性のための直接アクセス可能なメッセージリスト
  messages: initialMessages,
  isSearching: false,
  input: "",
  // 初期アクティブ会話IDはデフォルト
  activeConversationId: 'default',
  // リアルタイム購読の初期状態
  messageSubscription: null,
  connectionStatus: 'DISCONNECTED',
  connectionError: null,
} 