// src/mastra/tools/__tests__/index.integration.test.ts
// Mem0ツールの統合テスト - 実際のAPIを呼び出す

import { mem0RememberTool, mem0MemorizeTool } from '../index';
import { mem0 } from '../../integrations';

describe('Mem0 Memory Tools Integration Tests', () => {
  // このテストは実際のAPIを呼び出すため、MEM0_API_KEYが設定されている必要があります
  beforeAll(() => {
    // 環境変数チェック
    if (!process.env.MEM0_API_KEY) {
      console.warn('⚠️ Warning: MEM0_API_KEY is not set. Integration tests may fail.');
    }
  });

  describe('mem0MemorizeTool & mem0RememberTool', () => {
    it('記憶を保存して検索できること', async () => {
      // テスト用のユニークなメモリを作成（タイムスタンプ付き）
      const timestamp = new Date().toISOString();
      const testMemory = `テスト記憶 ${timestamp}: ユーザーはETH/USDの取引を好む`;
      const searchKeyword = `テスト記憶 ${timestamp}`;
      
      // 1. まず記憶を保存
      // @ts-expect-error - テスト用に型チェックを無視
      const saveResult = await mem0MemorizeTool.execute({
        context: { statement: testMemory }
      });
      
      // 保存結果の検証
      expect(saveResult).toEqual({ success: true });
      
      // 少し待機してAPIに反映されるのを待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. 保存した記憶を検索
      // @ts-expect-error - テスト用に型チェックを無視
      const searchResult = await mem0RememberTool.execute({
        context: { question: searchKeyword }
      });
      
      // 検索結果の検証
      expect(searchResult.answer).toContain('ETH/USD');
    }, 10000); // タイムアウトを10秒に設定
    
    it('存在しない記憶に対してはデフォルトメッセージを返すこと', async () => {
      // ランダムな文字列で検索
      const randomQuery = `存在しない記憶 ${Math.random().toString(36).substring(7)}`;
      
      // @ts-expect-error - テスト用に型チェックを無視
      const result = await mem0RememberTool.execute({
        context: { question: randomQuery }
      });
      
      // デフォルトメッセージが返ってくることを検証
      expect(result.answer).toBe('関連する記憶は見つかりませんでした。');
    });
  });
});
