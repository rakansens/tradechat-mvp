// lib/supabase/__tests__/supabase-memory.test.ts
// メモリ管理機能のユニットテスト
// 作成日: 2025/5/31

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  createMemory, 
  updateMemory, 
  deleteMemory,
  getMemoryById,
  getUserMemories,
  searchMemoriesBySimilarity,
  searchMemoriesByText
} from '../supabase-memory';

// Supabaseクライアントのモック
vi.mock('../supabase', () => {
  return {
    supabase: {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        data: null,
        error: null,
      })),
      rpc: vi.fn(() => ({
        data: null,
        error: null,
      })),
    }
  };
});

// テスト用データ
const testMemory = {
  id: 'test-id',
  user_id: 'test-user-id',
  content: 'テスト用メモリコンテンツ',
  metadata: { source: 'test' },
  external_id: 'ext-test-id',
  is_synced: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// テスト実行
describe('メモリ管理機能のテスト', () => {
  let mockResponse: { data: any; error: any };

  beforeEach(() => {
    // 各テスト前に実行
    mockResponse = { data: null, error: null };
    
    // Supabaseモックのリセット
    const { supabase } = require('../supabase');
    
    // 成功レスポンスをデフォルトに設定
    supabase.from().insert.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().update.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().delete.mockImplementation(() => {
      mockResponse.data = [];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().eq.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().order.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });

    supabase.from().select().ilike.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.rpc.mockImplementation(() => {
      mockResponse.data = [testMemory];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
  });

  afterEach(() => {
    // 各テスト後に実行
    vi.clearAllMocks();
  });

  describe('createMemory', () => {
    it('メモリを正常に作成できること', async () => {
      const result = await createMemory({
        user_id: 'test-user-id',
        content: 'テスト用メモリコンテンツ',
        metadata: { source: 'test' },
      });
      
      expect(result).toEqual(testMemory);
    });

    it('エラー時にnullを返すこと', async () => {
      const { supabase } = require('../supabase');
      
      supabase.from().insert.mockImplementation(() => {
        mockResponse.error = { message: 'テストエラー' };
        return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
      });
      
      const result = await createMemory({
        user_id: 'test-user-id',
        content: 'テスト用メモリコンテンツ',
      });
      
      expect(result).toBeNull();
    });
  });

  describe('updateMemory', () => {
    it('メモリを正常に更新できること', async () => {
      const result = await updateMemory('test-id', {
        content: '更新されたコンテンツ',
      });
      
      expect(result).toEqual(testMemory);
    });
  });

  describe('deleteMemory', () => {
    it('メモリを正常に削除できること', async () => {
      const result = await deleteMemory('test-id');
      expect(result).toBe(true);
    });
  });

  describe('getMemoryById', () => {
    it('IDによってメモリを正常に取得できること', async () => {
      const result = await getMemoryById('test-id');
      expect(result).toEqual(testMemory);
    });
  });

  describe('getUserMemories', () => {
    it('ユーザーのメモリを正常に取得できること', async () => {
      const result = await getUserMemories('test-user-id');
      expect(result).toEqual([testMemory]);
    });
  });

  describe('searchMemoriesBySimilarity', () => {
    it('類似度によるメモリ検索が正常に動作すること', async () => {
      const result = await searchMemoriesBySimilarity('test-user-id', [0.1, 0.2, 0.3]);
      expect(result).toEqual([testMemory]);
    });
  });

  describe('searchMemoriesByText', () => {
    it('テキスト検索が正常に動作すること', async () => {
      const result = await searchMemoriesByText('test-user-id', 'テスト');
      expect(result).toEqual([testMemory]);
    });
  });
}); 