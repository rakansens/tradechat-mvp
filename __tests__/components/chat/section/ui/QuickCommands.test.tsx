/**
 * __tests__/components/chat/section/ui/QuickCommands.test.tsx
 * QuickCommandsコンポーネントのテストスイート
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickCommands } from '@/components/chat/section/ui/QuickCommands';
import type { QuickCommand } from '@/hooks/chat';

// ボタンコンポーネントをモック
jest.mock('@/components/ui/button', () => ({
  Button: (props: any) => {
    const { children, onClick, ...rest } = props;
    return (
      React.createElement('button', {
        'data-testid': 'button',
        onClick,
        ...rest
      }, children)
    );
  }
}));

describe('QuickCommands', () => {
  // テスト用のモックコマンド
  const mockIcon = React.createElement('span', { 'data-testid': 'mock-icon' }, 'Icon');
  const mockAction1 = jest.fn();
  const mockAction2 = jest.fn();
  
  const mockCommands: QuickCommand[] = [
    {
      label: "Command 1",
      value: "command1",
      icon: mockIcon,
      action: mockAction1,
    },
    {
      label: "Command 2",
      value: "command2",
      icon: mockIcon,
      action: mockAction2,
    }
  ];
  
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });
  
  test('コマンドの数だけボタンがレンダリングされること', () => {
    render(React.createElement(QuickCommands, { commands: mockCommands }));
    
    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(mockCommands.length);
  });
  
  test('コマンドラベルがボタンに表示されること', () => {
    render(React.createElement(QuickCommands, { commands: mockCommands }));
    
    expect(screen.getByText('Command 1')).toBeInTheDocument();
    expect(screen.getByText('Command 2')).toBeInTheDocument();
  });
  
  test('ボタンをクリックするとactionが呼ばれること', () => {
    render(React.createElement(QuickCommands, { commands: mockCommands }));
    
    const buttons = screen.getAllByTestId('button');
    fireEvent.click(buttons[0]);
    
    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(mockAction2).not.toHaveBeenCalled();
    
    fireEvent.click(buttons[1]);
    expect(mockAction2).toHaveBeenCalledTimes(1);
  });
}); 