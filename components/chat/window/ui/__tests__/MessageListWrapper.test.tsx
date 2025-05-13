/**
 * components/chat/window/ui/__tests__/MessageListWrapper.test.tsx
 * 作成: MessageListWrapperコンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageListWrapper from '../MessageListWrapper';
import { MessageList } from '@/components/chat/VirtualMessageList';
import { ExtendedMessage } from '@/types/chat';
import { OpenEntry } from '@/types/entry';

// モック
jest.mock('@/components/chat/VirtualMessageList', () => ({
  MessageList: jest.fn(() => <div data-testid="message-list">MessageList Mock</div>)
}));

describe('MessageListWrapper', () => {
  const mockMessages: Partial<ExtendedMessage>[] = [
    { id: '1', content: 'Test message 1', role: 'user' },
    { id: '2', content: 'Test message 2', role: 'assistant' }
  ];
  
  const mockPendingEntry: Partial<OpenEntry> = {
    id: 'entry1',
    symbol: 'BTC-USD',
    entryPrice: 50000,
    side: 'buy'
  };
  
  const mockChatEndRef = { current: document.createElement('div') };
  const mockExecuteEntry = jest.fn();
  const mockEditPendingEntry = jest.fn();
  const mockCancelPendingEntry = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('MessageListに正しいpropsを渡す', () => {
    render(
      <MessageListWrapper
        messages={mockMessages as ExtendedMessage[]}
        pendingEntry={mockPendingEntry as OpenEntry}
        chatEndRef={mockChatEndRef as React.RefObject<HTMLDivElement>}
        executeEntry={mockExecuteEntry}
        editPendingEntry={mockEditPendingEntry}
        cancelPendingEntry={mockCancelPendingEntry}
      />
    );
    
    // MessageListコンポーネントに渡されるpropsを確認
    expect(MessageList).toHaveBeenCalledWith(
      {
        messages: mockMessages,
        pendingEntry: mockPendingEntry,
        chatEndRef: mockChatEndRef,
        executeEntry: mockExecuteEntry,
        editPendingEntry: mockEditPendingEntry,
        cancelPendingEntry: mockCancelPendingEntry
      },
      {}
    );
    
    // コンポーネントが表示されていることを確認
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });
  
  it('pendingEntryがnullの場合もエラーなく動作する', () => {
    render(
      <MessageListWrapper
        messages={mockMessages as ExtendedMessage[]}
        pendingEntry={null}
        chatEndRef={mockChatEndRef as React.RefObject<HTMLDivElement>}
        executeEntry={mockExecuteEntry}
      />
    );
    
    // nullのpendingEntryが正しく渡されていることを確認
    expect(MessageList).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingEntry: null
      }),
      {}
    );
  });
  
  it('オプションのpropsが省略された場合も正しく動作する', () => {
    render(
      <MessageListWrapper
        messages={mockMessages as ExtendedMessage[]}
        pendingEntry={null}
        chatEndRef={mockChatEndRef as React.RefObject<HTMLDivElement>}
      />
    );
    
    // オプションのpropsがundefinedとして渡されていることを確認
    expect(MessageList).toHaveBeenCalledWith(
      expect.objectContaining({
        executeEntry: undefined,
        editPendingEntry: undefined,
        cancelPendingEntry: undefined
      }),
      {}
    );
  });
}); 