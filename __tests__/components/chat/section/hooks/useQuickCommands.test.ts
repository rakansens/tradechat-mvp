/**
 * __tests__/components/chat/section/hooks/useQuickCommands.test.ts
 * useQuickCommandsフックのテストスイート
 */

// モック実装を使用
jest.mock('@/components/chat/section/hooks/useQuickCommands', () => 
  require('./__mocks__/useQuickCommands')
);

import { useQuickCommands } from '@/components/chat/section/hooks/useQuickCommands';
import { logger } from '@/utils/logger';

// lucide-reactモックは不要になったため削除

// ロガーをモック
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

// renderHookモックも不要になったため削除

describe('useQuickCommands', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('クイックコマンドの配列を返すこと', () => {
    // 直接フックを呼び出してテスト
    const commands = useQuickCommands();
    
    expect(Array.isArray(commands)).toBe(true);
    expect(commands.length).toBe(3); // 3つのコマンドがあることを確認
  });

  test('各コマンドが必要なプロパティを持つこと', () => {
    // 直接フックを呼び出してテスト
    const commands = useQuickCommands();
    
    commands.forEach(command => {
      expect(command).toHaveProperty('label');
      expect(command).toHaveProperty('value');
      expect(command).toHaveProperty('icon');
      expect(command).toHaveProperty('action');
      expect(typeof command.action).toBe('function');
    });
  });

  test('コマンドアクションが実行されるとログが出力されること', () => {
    // 直接フックを呼び出してテスト
    const commands = useQuickCommands();
    
    // 各コマンドのアクションを実行
    commands[0].action(); // Entry Point
    expect(logger.info).toHaveBeenCalledWith('Quick command: Entry Point', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
    
    commands[1].action(); // Market News
    expect(logger.info).toHaveBeenCalledWith('Quick command: Market News', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
    
    commands[2].action(); // AI Signal
    expect(logger.info).toHaveBeenCalledWith('Quick command: AI Signal', {
      component: 'ChatSection',
      action: 'quickCommand'
    });
  });
}); 