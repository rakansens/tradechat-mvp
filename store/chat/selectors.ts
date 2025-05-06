// store/chat/selectors.ts
// 更新: チャットストア用のメモ化されたセレクター関数とアクションセレクタを追加
// 更新: ストリーミング中のメッセージを処理するセレクターを追加
// 更新: 型安全性の向上のため、ChatState型を明示的に使用
//
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { ChatState, ExtendedMessage } from '@/types/chat';

// 基本セレクター
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsSearching = (state: ChatState) => state.isSearching;
export const selectInput = (state: ChatState) => state.input;

// アクションセレクタ
export const selectSetInput = (state: ChatState) => state.setInput;
export const selectSendMessage = (state: ChatState) => state.sendMessage;
export const selectClearMessages = (state: ChatState) => state.clearMessages;
export const selectAddMessage = (state: ChatState) => state.addMessage;
export const selectUpdateMessage = (state: ChatState) => state.updateMessage;
export const selectDeleteMessage = (state: ChatState) => state.deleteMessage;

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

// ストリーミング中のメッセージを含むすべてのメッセージを選択するセレクター
export const selectMessagesWithStreaming = createSelector(
  [selectMessages, selectIsSearching, selectLastMessage],
  (messages: ExtendedMessage[], isSearching: boolean, lastMessage: ExtendedMessage | null): ExtendedMessage[] => {
    // ストリーミング中でない場合は通常のメッセージを返す
    if (!isSearching || !lastMessage || lastMessage.role !== 'assistant') {
      return messages;
    }
    
    // ストリーミング中の場合、最後のメッセージが更新中であることを示す
    return messages.map((msg, index) => {
      // 最後のメッセージの場合、ストリーミング中であることを示すプロパティを追加
      if (index === messages.length - 1 && msg.role === 'assistant') {
        return {
          ...msg,
          isStreaming: true
        };
      }
      return msg;
    });
  }
);

// ストリーミング中のメッセージを選択するセレクター
export const selectStreamingMessage = createSelector(
  [selectMessages, selectIsSearching],
  (messages: ExtendedMessage[], isSearching: boolean): ExtendedMessage | null => {
    // ストリーミング中でない場合はnullを返す
    if (!isSearching || messages.length === 0) {
      return null;
    }
    
    // 最後のメッセージがAIのメッセージであれば、それをストリーミング中のメッセージとして返す
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      return {
        ...lastMessage,
        isStreaming: true
      };
    }
    
    return null;
  }
);
