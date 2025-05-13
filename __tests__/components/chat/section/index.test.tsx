/**
 * __tests__/components/chat/section/index.test.tsx
 * ChatSectionコンポーネントのテストスイート
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatSection from '@/components/chat/section';

// 依存コンポーネントをモック
jest.mock('@/components/ui/card', () => ({
  Card: (props: any) => {
    const { children, className, ...rest } = props;
    return React.createElement('div', { 'data-testid': 'card', className, ...rest }, children);
  },
  CardContent: (props: any) => {
    const { children, className, ...rest } = props;
    return React.createElement('div', { 'data-testid': 'card-content', className, ...rest }, children);
  },
  CardFooter: (props: any) => {
    const { children, className, ...rest } = props;
    return React.createElement('div', { 'data-testid': 'card-footer', className, ...rest }, children);
  },
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: (props: any) => {
    const { className, ...rest } = props;
    return React.createElement('hr', { 'data-testid': 'separator', className, ...rest });
  },
}));

jest.mock('@/components/chat/ChatWindow', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((props) => {
    return React.createElement('div', { 
      'data-testid': 'chat-window', 
      ref: props.ref 
    }, 'Chat Window');
  }),
}));

// UIコンポーネントをモック
jest.mock('@/components/chat/section/ui/Header', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return React.createElement('div', { 'data-testid': 'header' }, 'Header');
  }),
}));

jest.mock('@/components/chat/section/ui/QuickCommands', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return React.createElement('div', { 'data-testid': 'quick-commands' }, 'Quick Commands');
  }),
}));

jest.mock('@/components/chat/section/ui/ExecuteButton', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return React.createElement('div', { 'data-testid': 'execute-button' }, 'Execute Button');
  }),
}));

jest.mock('@/components/chat/section/ui/InputForm', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return React.createElement('div', { 'data-testid': 'input-form' }, 'Input Form');
  }),
}));

// フックをモック
jest.mock('@/hooks/chat', () => ({
  useChatSectionStores: jest.fn().mockReturnValue({
    chat: {
      messages: [],
      isLoading: false,
      input: '',
      setInput: jest.fn(),
      sendMessage: jest.fn(),
    },
    entry: {
      pendingEntry: null,
      hasPendingEntry: false,
    },
  }),
  useQuickCommands: jest.fn().mockReturnValue([
    { label: 'Command 1', value: 'command1', icon: React.createElement('span'), action: jest.fn() },
    { label: 'Command 2', value: 'command2', icon: React.createElement('span'), action: jest.fn() },
  ]),
}));

describe('ChatSection', () => {
  // テスト用のprops
  const mockProps = {
    // 明示的にnullを許容しないRefObjectを作成
    chatEndRef: { current: document.createElement('div') } as React.RefObject<HTMLDivElement>,
    executeEntry: jest.fn(),
    editPendingEntry: jest.fn(),
    cancelPendingEntry: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('コンポーネントが正しくレンダリングされること', () => {
    render(React.createElement(ChatSection, mockProps));
    
    // 主要なコンポーネントが存在することを確認
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
    expect(screen.getByTestId('separator')).toBeInTheDocument();
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByTestId('quick-commands')).toBeInTheDocument();
    expect(screen.getByTestId('execute-button')).toBeInTheDocument();
    expect(screen.getByTestId('input-form')).toBeInTheDocument();
  });
}); 