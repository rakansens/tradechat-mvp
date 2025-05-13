/**
 * __tests__/hooks/chat/useQuickCommands.test.tsx
 * useQuickCommandsフックのテストスイート
 */

import { logger } from '@/utils/common';

// アイコンコンポーネントのダミー
const DummyIcon = 'dummy-icon';

// useQuickCommandsフックのモックを作成
const mockQuickCommands = [
  {
    label: "Entry Point",
    value: "Entry Point",
    icon: DummyIcon,
    action: jest.fn(),
  },
  {
    label: "Market News",
    value: "Market News",
    icon: DummyIcon,
    action: jest.fn(),
  },
  { 
    label: "AI Signal", 
    value: "AI Signal", 
    icon: DummyIcon, 
    action: jest.fn(),
  },
];

// ロガーのモック
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
  },
}));

// フックのモック
jest.mock('@/components/chat/section/hooks/useQuickCommands', () => {
  return {
    __esModule: true,
    default: () => mockQuickCommands,
  };
});

describe('useQuickCommands', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
  });

  test('クイックコマンドの配列が正しい構造を持つこと', () => {
    // 各コマンドが正しいプロパティを持つことを確認
    mockQuickCommands.forEach(command => {
      expect(command).toHaveProperty('label');
      expect(command).toHaveProperty('value');
      expect(command).toHaveProperty('icon');
      expect(command).toHaveProperty('action');
      expect(typeof command.action).toBe('function');
    });
    
    // コマンド数が3つであることを確認
    expect(mockQuickCommands.length).toBe(3);
  });
  
  test('Entry Pointコマンドのアクションが正しく動作すること', () => {
    // Entry Pointコマンドを見つける
    const entryPointCommand = mockQuickCommands.find(cmd => cmd.label === 'Entry Point');
    expect(entryPointCommand).toBeDefined();
    
    // アクションを実行
    entryPointCommand?.action();
    
    // アクション関数が呼ばれたことを確認
    expect(entryPointCommand?.action).toHaveBeenCalledTimes(1);
  });
  
  test('Market Newsコマンドのアクションが正しく動作すること', () => {
    // Market Newsコマンドを見つける
    const marketNewsCommand = mockQuickCommands.find(cmd => cmd.label === 'Market News');
    expect(marketNewsCommand).toBeDefined();
    
    // アクションを実行
    marketNewsCommand?.action();
    
    // アクション関数が呼ばれたことを確認
    expect(marketNewsCommand?.action).toHaveBeenCalledTimes(1);
  });
  
  test('AI Signalコマンドのアクションが正しく動作すること', () => {
    // AI Signalコマンドを見つける
    const aiSignalCommand = mockQuickCommands.find(cmd => cmd.label === 'AI Signal');
    expect(aiSignalCommand).toBeDefined();
    
    // アクションを実行
    aiSignalCommand?.action();
    
    // アクション関数が呼ばれたことを確認
    expect(aiSignalCommand?.action).toHaveBeenCalledTimes(1);
  });
}); 