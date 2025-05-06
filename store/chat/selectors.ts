// store/chat/selectors.ts
// 作成: チャットストア用のメモ化されたセレクター関数
// 
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { ChatState, ExtendedMessage } from '@/types/chat';

// 基本セレクター
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsSearching = (state: ChatState) => state.isSearching;

// メモ化されたセレクター
export const selectLastMessage = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): ExtendedMessage | null => {
    if (!messages || messages.length === 0) return null;
    return messages[messages.length - 1];
  }
);

// メッセージ数セレクター
export const selectMessageCount = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): number => {
    return messages.length;
  }
);

// ユーザーメッセージのみを選択するセレクター
export const selectUserMessages = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): ExtendedMessage[] => {
    return messages.filter(message => message.role === 'user');
  }
);

// AIメッセージのみを選択するセレクター
export const selectAIMessages = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): ExtendedMessage[] => {
    return messages.filter(message => message.role === 'assistant');
  }
);

// プロポーザルメッセージのみを選択するセレクター
export const selectProposalMessages = createSelector(
  [selectMessages],
  (messages: ExtendedMessage[]): ExtendedMessage[] => {
    return messages.filter(message => message.isProposal === true);
  }
);

// 最新のプロポーザルメッセージを選択するセレクター
export const selectLatestProposal = createSelector(
  [selectProposalMessages],
  (proposalMessages: ExtendedMessage[]): ExtendedMessage | null => {
    if (!proposalMessages || proposalMessages.length === 0) return null;
    return proposalMessages[proposalMessages.length - 1];
  }
);
