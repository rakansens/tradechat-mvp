// store/chat/utils.ts
// チャットスライス用のユーティリティ関数
// 作成: 2025/6/30 - ConversationState初期化の一貫性を確保するためのヘルパー関数

import type { ConversationState, ConnectionStatus } from './state';
import type { ExtendedMessage } from '@/types/chat';

/**
 * 空の会話状態を作成するヘルパー関数
 * @param title 会話のタイトル (デフォルト: '新しい会話')
 * @param initialMessages 初期メッセージ配列 (デフォルト: 空配列)
 * @param connectionStatus 初期接続状態 (デフォルト: 'DISCONNECTED')
 * @returns 初期化されたConversationState
 */
export const createEmptyConversation = (
  title = '新しい会話',
  initialMessages: ExtendedMessage[] = [],
  connectionStatus: ConnectionStatus = 'DISCONNECTED'
): ConversationState => ({
  messages: initialMessages,
  isSearching: false,
  input: '',
  systemPrompt: null,
  title,
  connectionStatus,
  connectionError: null,
  lastMessageAt: null,
});

/**
 * 会話状態が有効かどうかを検証するヘルパー関数
 * @param state 検証する会話状態
 * @returns 会話状態が有効な場合はtrue、そうでない場合はfalse
 */
export const isValidConversation = (state: any): state is ConversationState => {
  return (
    state &&
    Array.isArray(state.messages) &&
    typeof state.isSearching === 'boolean' &&
    typeof state.input === 'string' &&
    typeof state.title === 'string'
  );
}; 