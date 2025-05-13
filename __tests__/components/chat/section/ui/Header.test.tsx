/**
 * __tests__/components/chat/section/ui/Header.test.tsx
 * Headerコンポーネントのテストスイート
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/chat/section/ui/Header';

// Lucideのアイコンをモック
jest.mock('lucide-react', () => ({
  MessageSquare: () => React.createElement('span', { 'data-testid': 'message-square-icon' }, 'MessageSquare'),
}));

// Cardコンポーネントをモック
jest.mock('@/components/ui/card', () => ({
  CardHeader: (props: any) => {
    const { children, ...rest } = props;
    return React.createElement('header', { 'data-testid': 'card-header', ...rest }, children);
  },
  CardTitle: (props: any) => {
    const { children, ...rest } = props;
    return React.createElement('h3', { 'data-testid': 'card-title', ...rest }, children);
  },
}));

describe('Header', () => {
  test('ヘッダーがレンダリングされること', () => {
    render(React.createElement(Header));
    
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
  });
  
  test('タイトルが正しく表示されること', () => {
    render(React.createElement(Header));
    
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });
  
  test('アイコンが表示されること', () => {
    render(React.createElement(Header));
    
    expect(screen.getByTestId('message-square-icon')).toBeInTheDocument();
  });
}); 