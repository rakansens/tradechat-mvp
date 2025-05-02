// app/api/mastra/__tests__/route.test.ts
// MastraのAPIルートハンドラーのテスト (Integration Test Style)

import { NextRequest } from 'next/server';
// Import the actual handlers
import { GET, POST } from '../[[...mastra]]/route';

describe('Mastra API Routes (Integration)', () => {
  describe('GET handler', () => {
    it('ヘルスチェックレスポンスを返すこと', async () => {
      // リクエストモック作成 (No change needed for GET request itself)
      const req = new NextRequest('http://localhost:3000/api/mastra');
      
      // テスト実行
      const response = await GET();
      
      // レスポンス検証 (No change needed for GET assertion)
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Mastra API is up');
    });
  });

  describe('POST handler', () => {
    it('チャットメッセージを処理して応答ストリームを返すこと', async () => {
      // Check for required env vars for integration test
      if (!process.env.OPENAI_API_KEY || !process.env.MEM0_API_KEY) {
        console.warn('Skipping POST integration test: Required API keys (OPENAI_API_KEY, MEM0_API_KEY) not found in environment.');
        return; // Skip test if keys aren't set
      }

      // リクエストデータ
      const messages = [{ role: 'user', content: 'こんにちは' }];
      
      // リクエストモック作成
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      });

      // テスト実行
      const response = await POST(req);

      // レスポンス検証
      expect(response.status).toBe(200); // Expect OK status
      expect(response.body).toBeInstanceOf(ReadableStream); // Expect a stream back

      // Optionally, read from the stream to ensure content (can be complex)
      // try {
      //   const reader = response.body.getReader();
      //   const decoder = new TextDecoder();
      //   let done = false;
      //   let resultText = '';
      //   while (!done) {
      //     const { value, done: readerDone } = await reader.read();
      //     done = readerDone;
      //     if (value) {
      //       resultText += decoder.decode(value, { stream: true });
      //     }
      //   }
      //   console.log('Streamed response:', resultText);
      //   expect(resultText.length).toBeGreaterThan(0); // Basic check
      // } catch (error) {
      //   console.error('Error reading stream:', error);
      //   fail('Failed to read response stream');
      // }
    });

    it('無効なメッセージ配列で400エラーを返すこと', async () => {
      // 無効なリクエスト（ messages が配列でない）
      const invalidBody = { messages: 'not-an-array' };
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      });

      // テスト実行
      const response = await POST(req);

      // レスポンス検証
      expect(response.status).toBe(400); // Expect Bad Request
      const text = await response.text();
      expect(text).toContain('messages must be an array');
    });

    // Add more tests for threadId, resourceId, etc. if needed
  });
});
