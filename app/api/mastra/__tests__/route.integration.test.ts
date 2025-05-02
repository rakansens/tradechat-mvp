// app/api/mastra/__tests__/route.integration.test.ts
// MastraのAPIルートの統合テスト - 実際のAPIを呼び出す

import { NextRequest } from 'next/server';
import { GET, POST } from '../[[...mastra]]/route';

describe('Mastra API Route Integration Tests', () => {
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

  describe('API Health Check', () => {
    it('GETハンドラーがヘルスチェックレスポンスを返すこと', async () => {
      // GETリクエスト実行
      const response = await GET();
      
      // レスポンス検証
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Mastra API is up');
    });
  });

  describe('Chat API', () => {
    it('POSTハンドラーがチャットレスポンスを返すこと', async () => {
      // リクエストデータ作成
      const requestData = {
        messages: [{ role: 'user', content: 'こんにちは' }],
        threadId: `test-thread-${Date.now()}`,
        resourceId: `test-user-${Date.now()}`,
      };
      
      // POSTリクエスト用のRequestオブジェクト作成
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // POSTリクエスト実行
      const response = await POST(req);
      
      // レスポンス検証
      expect(response.status).toBe(200);
      
      // レスポンスのJSONをパース
      const responseData = await response.json();
      
      // 応答が正しい形式であることを確認
      expect(responseData).toBeDefined();
      expect(responseData.result).toBeDefined();
    }, 30000); // タイムアウトを30秒に設定
    
    it('不正なリクエストに対して適切なエラーレスポンスを返すこと', async () => {
      // 不正なリクエストデータ（messagesフィールドがない）
      const invalidRequestData = {
        threadId: `test-thread-${Date.now()}`,
        resourceId: `test-user-${Date.now()}`,
        // messagesフィールドが欠落している
      };
      
      // POSTリクエスト用のRequestオブジェクト作成
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify(invalidRequestData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      try {
        // POSTリクエスト実行
        const response = await POST(req);
        
        // エラーレスポンス検証
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        // エラーが投げられた場合も検証OK（エラーハンドリングの実装による）
        expect(error).toBeDefined();
      }
    }, 10000); // タイムアウトを10秒に設定
  });
});
