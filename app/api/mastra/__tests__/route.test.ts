// app/api/mastra/__tests__/route.test.ts
// MastraのAPIルートハンドラーのテスト

import { NextRequest } from 'next/server';
import { GET, POST } from '../[[...mastra]]/route';
import { createDirectAgent } from '../../../../src/mastra/agents';
import { Mastra } from '@mastra/core';

// 依存モジュールのモック
jest.mock('../../../../src/mastra/agents', () => ({
  createDirectAgent: jest.fn().mockReturnValue({
    name: 'TradingAssistant',
    stream: jest.fn(),
    generate: jest.fn(),
  }),
}));

jest.mock('@mastra/core', () => ({
  Mastra: jest.fn().mockImplementation(() => ({
    POST: jest.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ result: 'success' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }),
    GET: jest.fn().mockImplementation(async () => {
      return new Response('Mastra API is up', { status: 200 });
    }),
  })),
}));

describe('Mastra API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET handler', () => {
    it('ヘルスチェックレスポンスを返すこと', async () => {
      // リクエストモック作成
      const req = new NextRequest('http://localhost:3000/api/mastra');
      
      // テスト実行
      const response = await GET();
      
      // レスポンス検証
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('Mastra API is up');
    });
  });

  describe('POST handler', () => {
    it('チャットメッセージを処理して応答すること', async () => {
      // リクエストデータ
      const requestData = {
        messages: [{ role: 'user', content: 'こんにちは' }],
        threadId: 'thread-123',
        resourceId: 'user-456',
      };
      
      // リクエストモック作成
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // テスト実行
      const response = await POST(req);
      
      // レスポンス検証
      expect(response.status).toBe(200);
      
      // MastraとAgentが正しく初期化されたことを確認
      expect(createDirectAgent).toHaveBeenCalled();
      expect(Mastra).toHaveBeenCalled();
      
      const mastraInstance = (Mastra as jest.Mock).mock.instances[0];
      expect(mastraInstance.POST).toHaveBeenCalledWith(req);
    });
    
    it('無効なリクエストに対してエラーを返すこと', async () => {
      // 無効なリクエスト（中身が空）
      const req = new NextRequest('http://localhost:3000/api/mastra/chat', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // エラーをシミュレート
      (Mastra as unknown as jest.Mock).mockImplementationOnce(() => ({
        POST: jest.fn().mockRejectedValue(new Error('Invalid request')),
      }));
      
      // テスト実行とエラーハンドリング確認
      try {
        await POST(req);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Invalid request');
      }
    });
  });
});
