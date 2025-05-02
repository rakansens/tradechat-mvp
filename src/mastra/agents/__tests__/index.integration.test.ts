// src/mastra/agents/__tests__/index.integration.test.ts
// 更新: 型エラーを修正し、型安全なアクセスを実装

import { createChatAgent, createDirectAgent } from '../index';
import { Memory } from '@mastra/memory';

// レスポンスの型定義
// Mastra APIのレスポンスの可能性をカバーする型
// 実際のレスポンスに合わせて必要に応じて拡張する
type MastraResponse = {
  text?: string;
  content?: string;
  [key: string]: any;
};

describe('Agent Factory Integration Tests', () => {
  // このテストは実際のAPIを呼び出すため、環境変数が設定されている必要があります
  beforeAll(() => {
    // 環境変数チェック
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ Warning: OPENAI_API_KEY is not set. Integration tests may fail.');
    }
    if (!process.env.MEM0_API_KEY) {
      console.warn('⚠️ Warning: MEM0_API_KEY is not set. Integration tests may fail.');
    }
  });

  describe('Agent Creation', () => {
    it('メモリありでエージェントを作成して応答を生成できること', async () => {
      // 1. メモリインスタンスを作成
      const memory = new Memory();
      
      // 2. エージェント作成
      const agent = createChatAgent(memory);
      
      // 3. エージェントが生成したか確認
      expect(agent).toBeDefined();
      expect(agent.name).toBe('TradingAssistant');
      
      // 3. シンプルなプロンプトで応答を生成してテスト
      // 型安全なアクセスのために型アサーションを使用
      const response = await agent.generate([
        {
          role: 'user',
          content: 'こんにちは、簡単に自己紹介してください。',
        }
      ]) as MastraResponse;
      
      // 5. 応答が生成されたことを確認
      expect(response).toBeTruthy();
      expect(typeof response).toBe('object');
      // レスポンスの形式は {text: string} または {content: string} の場合がある
      // 必ず文字列を返すようにすることでundefinedの可能性を排除
      const responseText = 'text' in response && response.text ? response.text : 
                         'content' in response && response.content ? response.content : 
                         JSON.stringify(response);
      expect(responseText.length).toBeGreaterThan(10);
    }, 30000); // タイムアウトを30秒に設定
    
    it('DirectエージェントでAPIレスポンスを生成できること', async () => {
      // 1. Directエージェント作成
      const agent = createDirectAgent();
      
      // 2. エージェントが生成したか確認
      expect(agent).toBeDefined();
      expect(agent.name).toBe('TradingAssistant');
      
      // 3. シンプルなプロンプトで応答を生成してテスト
      // 型安全なアクセスのために型アサーションを使用
      const response = await agent.generate([
        {
          role: 'user',
          content: '今日はどんな相場ですか？',
        }
      ]) as MastraResponse;
      
      // 4. 応答が生成されたことを確認
      expect(response).toBeTruthy();
      expect(typeof response).toBe('object');
      // レスポンスの形式は {text: string} または {content: string} の場合がある
      // 必ず文字列を返すようにすることでundefinedの可能性を排除
      const responseText = 'text' in response && response.text ? response.text : 
                         'content' in response && response.content ? response.content : 
                         JSON.stringify(response);
      expect(responseText.length).toBeGreaterThan(10);
    }, 30000); // タイムアウトを30秒に設定
  });
});
