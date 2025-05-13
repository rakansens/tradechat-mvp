/**
 * __tests__/components/chat/ExecuteButton.test.tsx
 * ExecuteButtonコンポーネントのテストスイート
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ExecuteButton } from '@/components/chat/section/ui/ExecuteButton';
import type { OpenEntry } from '@/types/entry';

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
      <ExecuteButton 
        pendingEntry={null} 
        executeEntry={mockExecuteEntry} 
      />
    );
    
    // コンポーネントが何もレンダリングしていないことを確認
    expect(container.firstChild).toBeNull();
  });
  
  test('pendingEntryがある場合、ボタンが表示されること', () => {
    render(
      <ExecuteButton 
        pendingEntry={mockEntry} 
        executeEntry={mockExecuteEntry} 
      />
    );
    
    // ボタンが表示されていることを確認
    const button = screen.getByText(/Execute Entry/i);
    expect(button).toBeInTheDocument();
  });
  
  test('ボタンをクリックするとexecuteEntry関数が呼ばれること', () => {
    render(
      <ExecuteButton 
        pendingEntry={mockEntry} 
        executeEntry={mockExecuteEntry} 
      />
    );
    
    // ボタンをクリックしてexecuteEntry関数が呼ばれることを確認
    const button = screen.getByText(/Execute Entry/i);
    fireEvent.click(button);
    
    expect(mockExecuteEntry).toHaveBeenCalledTimes(1);
  });
}); 