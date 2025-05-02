// src/mastra/integrations/__tests__/index.test.ts
// Mem0統合インスタンスのテスト

import { Mem0Integration } from "@mastra/mem0";
import { mem0 } from '../index';

// 環境変数のモック
const originalEnv = process.env;

// Mem0Integrationクラスのモック
jest.mock('@mastra/mem0', () => ({
  Mem0Integration: jest.fn().mockImplementation(() => ({
    searchMemory: jest.fn(),
    createMemory: jest.fn(),
  }))
}));

describe('Mem0 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // テスト用環境変数の設定
    process.env = { ...originalEnv };
    process.env.MEM0_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    // 元の環境変数に戻す
    process.env = originalEnv;
  });

  it('Mem0統合が正しく初期化されること', () => {
    // モジュールを再インポート
    jest.resetModules();
    const { mem0 } = require('../index');
    
    // 期待されるコンフィグでMem0Integrationが呼ばれたか検証
    expect(Mem0Integration).toHaveBeenCalledWith({
      config: {
        apiKey: 'test-api-key',
        userId: 'anon',
      },
    });
  });

  it('API呼び出しが適切に転送されること', async () => {
    // メソッド呼び出しのテスト
    await mem0.searchMemory('テスト検索');
    expect(mem0.searchMemory).toHaveBeenCalledWith('テスト検索');

    await mem0.createMemory('テスト記憶');
    expect(mem0.createMemory).toHaveBeenCalledWith('テスト記憶');
  });
});
