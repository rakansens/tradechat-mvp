// types/store/chat.ts
// 作成: 2025-10-07 - チャットストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/chat/state.tsの定義を統合

import type { ExtendedMessage, ConnectionInfo } from '@/types/chat/base';

/**
 * このファイルはチャットストアの型定義を提供します。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

// 必要な型を再エクスポート
export type { ExtendedMessage, ConnectionInfo };

// リアルタイム接続状態タイプ
export type ChatConnectionStatus = 
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
  connectionStatus?: ChatConnectionStatus;
  connectionError?: string | null;
  lastMessageAt?: string | null;
}

// チャットスライスの状態インターフェース
export interface ChatState {
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
  connectionStatus: ChatConnectionStatus;
  connectionError: string | null;
}

// チャットスライスのアクション定義
export interface ChatActions {
  addMessage: (message: ExtendedMessage) => void;
  updateMessage: (messageId: string, content: string) => void;
  setIsTyping: (isTyping: boolean) => void;
  setMessages: (messages: ExtendedMessage[]) => void;
  setIsSearching: (isSearching: boolean) => void;
  setInput: (input: string) => void;
  sendMessage: (message: string) => void;
  clearMessages: (conversationId?: string) => void;
  deleteMessage: (messageId: string) => void;
  
  // 会話管理関連
  createConversation: (title: string, systemPrompt?: string) => string;
  setCurrentConversation: (conversationId: string) => void;
  updateConversation: (conversationId: string, data: Partial<ConversationState>) => void;
  deleteConversation: (conversationId: string) => void;
  
  // AI関連機能
  handleEntryPointQuery: () => void;
  handleNewsQuery: () => void;
  handleAIProposalQuery: () => void;
  
  // 接続状態管理
  setConnection: (connectionInfo: Partial<ConnectionInfo>) => void;
}

// 完全なチャットスライスの型定義
export type ChatSlice = ChatState & ChatActions; 