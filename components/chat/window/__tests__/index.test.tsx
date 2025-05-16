/**
 * components/chat/window/__tests__/index.test.tsx
 * 作成: ChatWindowコンポーネントのテスト
 * 更新: 2025-06-28 - useScrollManagerモックをuseAutoScrollに更新
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatWindow from '../index';

// モック
jest.mock('../hooks/useChatWindowStores', () => () => ({
  messages: [{ id: '1', content: 'Test message', role: 'user' }],
  isSearching: false,
  pendingEntry: null,
  streamingMessage: null
}));

jest.mock('@/hooks/ui/useAutoScroll', () => () => ({
  containerRef: { current: null },
  showScrollButton: true,
  handleScroll: jest.fn(),
  scrollToBottom: jest.fn()
}));

jest.mock('../ui/MessageListWrapper', () => {
  return {
    __esModule: true,
    default: jest.fn(props => (
      <div data-testid="message-list-wrapper">
        MessageListWrapper Mock
        <button 
          data-testid="execute-entry-button"
          onClick={() => props.executeEntry && props.executeEntry({ symbol: 'BTC', price: 50000 })}
        >
          Execute Entry
        </button>
      </div>
    ))
  };
});

jest.mock('../ui/SearchingIndicator', () => ({
  SearchingIndicator: jest.fn(props => (
    <div data-testid="searching-indicator">
      {props.isSearching ? 'Searching...' : props.isThinking ? 'Thinking...' : 'Idle'}
    </div>
  ))
}));

jest.mock('../ui/ScrollDownButton', () => ({
  ScrollDownButton: jest.fn(props => (
    <button 
      data-testid="scroll-down-button"
      style={{ display: props.isVisible ? 'block' : 'none' }}
      onClick={props.onClick}
    >
      Scroll Down
    </button>
  ))
}));

describe('ChatWindow', () => {
  const mockExecuteEntry = jest.fn();
  const mockEditPendingEntry = jest.fn();
  const mockCancelPendingEntry = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('正しくレンダリングされる', () => {
    render(
      <ChatWindow
        isThinking={false}
        onExecuteEntry={mockExecuteEntry}
        editPendingEntry={mockEditPendingEntry}
        cancelPendingEntry={mockCancelPendingEntry}
      />
    );
    
    expect(screen.getByTestId('message-list-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('searching-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('scroll-down-button')).toBeInTheDocument();
  });
  
  it('executeEntryが正しく呼ばれる', () => {
    render(
      <ChatWindow
        isThinking={false}
        onExecuteEntry={mockExecuteEntry}
      />
    );
    
    // エントリー実行ボタンをクリック
    fireEvent.click(screen.getByTestId('execute-entry-button'));
    
    // mockExecuteEntryが呼ばれたことを確認
    expect(mockExecuteEntry).toHaveBeenCalledWith({ symbol: 'BTC', price: 50000 });
  });
  
  it('isThinking=trueの場合、SearchingIndicatorにプロパティが正しく渡される', () => {
    render(
      <ChatWindow
        isThinking={true}
        onExecuteEntry={mockExecuteEntry}
      />
    );
    
    // "Thinking..."と表示されていることを確認
    expect(screen.getByTestId('searching-indicator')).toHaveTextContent('Thinking...');
  });
}); 