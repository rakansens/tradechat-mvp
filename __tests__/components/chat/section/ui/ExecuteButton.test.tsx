/**
 * __tests__/components/chat/section/ui/ExecuteButton.test.tsx
 * ExecuteButtonコンポーネントのテストスイート
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExecuteButton } from '@/components/chat/section/ui/ExecuteButton';
import type { OpenEntry } from '@/types/entry';

// Lucideのアイコンをモック
jest.mock('lucide-react', () => ({
  Send: () => React.createElement('span', { 'data-testid': 'send-icon' }, 'Send'),
}));

// Buttonコンポーネントをモック
jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => {
    const { children, onClick, ...rest } = props;
    return React.createElement('button', {
      'data-testid': 'button',
      onClick,
      ...rest
    }, children);
  }
}));

describe('ExecuteButton', () => {
  const mockExecuteEntry = jest.fn();
  
  // テスト用のモックエントリー
  const mockEntry: OpenEntry = {
    id: 'test-entry-1',
    side: 'buy',
    price: 50000,
    symbol: 'BTCUSDT',
    time: '2023-06-10T12:00:00Z',
    status: 'open',
    takeProfit: 55000,
    stopLoss: 48000
  };
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });
  
  test('pendingEntryがnullの場合、コンポーネントはレンダリングされないこと', () => {
    const { container } = render(
      React.createElement(ExecuteButton, { 
        pendingEntry: null, 
        executeEntry: mockExecuteEntry 
      })
    );
    
    // コンポーネントが何もレンダリングしていないことを確認
    expect(container.firstChild).toBeNull();
  });
  
  test('pendingEntryがある場合、ボタンが表示されること', () => {
    render(
      React.createElement(ExecuteButton, { 
        pendingEntry: mockEntry, 
        executeEntry: mockExecuteEntry 
      })
    );
    
    // ボタンが表示されていることを確認
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText(/Execute Entry/i)).toBeInTheDocument();
  });
  
  test('ボタンをクリックするとexecuteEntry関数が呼ばれること', () => {
    render(
      React.createElement(ExecuteButton, { 
        pendingEntry: mockEntry, 
        executeEntry: mockExecuteEntry 
      })
    );
    
    // ボタンをクリックしてexecuteEntry関数が呼ばれることを確認
    const button = screen.getByTestId('button');
    fireEvent.click(button);
    
    expect(mockExecuteEntry).toHaveBeenCalledTimes(1);
  });
}); 