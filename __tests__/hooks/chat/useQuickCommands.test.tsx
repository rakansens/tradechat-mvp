/**
 * __tests__/hooks/chat/useQuickCommands.test.tsx
 * useQuickCommandsフックのテストスイート
 */

import React from 'react';
import { renderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { useQuickCommands } from '@/hooks/chat';
import { logger } from '@/utils/logger';

// ロガーのモック
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

describe('useQuickCommands', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });

  test('クイックコマンドの配列を返すこと', () => {
    const { result } = renderHook(() => useQuickCommands());
    
    // 3つのコマンドが返されることを確認
    expect(result.current).toHaveLength(3);
    
    // 各コマンドが正しいプロパティを持つことを確認
    result.current.forEach(command => {
      expect(command).toHaveProperty('label');
      expect(command).toHaveProperty('value');
      expect(command).toHaveProperty('icon');
      expect(command).toHaveProperty('action');
      expect(typeof command.action).toBe('function');
    });
  });
  
  test('Entry Pointコマンドのアクションが正しく動作すること', () => {
    const { result } = renderHook(() => useQuickCommands());
    
    // Entry Pointコマンドを見つける
    const entryPointCommand = result.current.find(cmd => cmd.label === 'Entry Point');
    expect(entryPointCommand).toBeDefined();
    
    // アクションを実行
    act(() => {
      entryPointCommand?.action();
    });
    
    // ロガーが正しく呼ばれることを確認
    expect(logger.info).toHaveBeenCalledWith('Quick command: Entry Point', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  });
  
  test('Market Newsコマンドのアクションが正しく動作すること', () => {
    const { result } = renderHook(() => useQuickCommands());
    
    // Market Newsコマンドを見つける
    const marketNewsCommand = result.current.find(cmd => cmd.label === 'Market News');
    expect(marketNewsCommand).toBeDefined();
    
    // アクションを実行
    act(() => {
      marketNewsCommand?.action();
    });
    
    // ロガーが正しく呼ばれることを確認
    expect(logger.info).toHaveBeenCalledWith('Quick command: Market News', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  });
  
  test('AI Signalコマンドのアクションが正しく動作すること', () => {
    const { result } = renderHook(() => useQuickCommands());
    
    // AI Signalコマンドを見つける
    const aiSignalCommand = result.current.find(cmd => cmd.label === 'AI Signal');
    expect(aiSignalCommand).toBeDefined();
    
    // アクションを実行
    act(() => {
      aiSignalCommand?.action();
    });
    
    // ロガーが正しく呼ばれることを確認
    expect(logger.info).toHaveBeenCalledWith('Quick command: AI Signal', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  });
}); 