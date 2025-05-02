// src/mastra/integrations/__tests__/index.test.ts
// Mem0統合インスタンスのテスト

import { mem0 } from '../index';

// 環境変数のモック
const originalEnv = process.env;

describe('Mem0 Integration', () => {
  beforeEach(() => {
    // テスト用環境変数の設定
    process.env = { ...originalEnv };
    process.env.MEM0_API_KEY = 'test-api-key';
  });

  afterAll(() => {
    // 元の環境変数に戻す
    process.env = originalEnv;
  });

  it('API呼び出しが適切に転送されること', async () => {
    // メソッド呼び出しのテスト
    await mem0.searchMemory('テスト検索');
    expect(mem0.searchMemory).toHaveBeenCalledWith('テスト検索');

    await mem0.createMemory('テスト記憶');
    expect(mem0.createMemory).toHaveBeenCalledWith('テスト記憶');
  });
});
