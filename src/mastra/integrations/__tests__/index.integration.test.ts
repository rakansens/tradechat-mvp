// src/mastra/integrations/__tests__/index.integration.test.ts
// Mem0統合モジュールの統合テスト - 実際のAPIを呼び出す

import { mem0 } from '../index';

describe('Mem0 Integration Module Tests', () => {
  // このテストは実際のAPIを呼び出すため、MEM0_API_KEYが設定されている必要があります
  beforeAll(() => {
    // 環境変数チェック
    if (!process.env.MEM0_API_KEY) {
      console.warn('⚠️ Warning: MEM0_API_KEY is not set. Integration tests may fail.');
    }
  });

  describe('Mem0 API Integration', () => {
    it('APIを使用して記憶を作成・検索できること', async () => {
      // テスト用のユニークなメモリを作成（タイムスタンプ付き）
      const timestamp = new Date().toISOString();
      const testMemory = `統合テスト記憶 ${timestamp}: ユーザーはBTC/JPYの取引を好む`;
      const searchKeyword = `統合テスト記憶 ${timestamp}`;
      
      // 1. 記憶作成
      await mem0.createMemory(testMemory);
      
      // 少し待機してAPIに反映されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. 記憶検索
      const result = await mem0.searchMemory(searchKeyword);
      
      // 検索結果の検証
      expect(result).toContain('BTC/JPY');
    }, 10000); // タイムアウトを10秒に設定
    
    it('存在しない記憶に対しては空文字を返すこと', async () => {
      // ランダムな文字列で検索
      const randomQuery = `存在しない統合テスト記憶 ${Math.random().toString(36).substring(7)}`;
      
      // 記憶検索
      const result = await mem0.searchMemory(randomQuery);
      
      // 空文字が返ることを検証
      expect(result).toBe('');
    });
  });
});
