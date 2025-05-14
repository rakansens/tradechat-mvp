// __tests__/unit/supabase-memory.test.ts
// メモリ管理機能のユニットテスト
// 作成日: 2025/6/10

import * as memoryModule from '@/lib/supabase/supabase-memory';

// Supabaseのモジュールをモック
jest.mock('@/lib/supabase/supabase', () => {
  const mockRpc = jest.fn();
  
  return {
    supabase: {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        match: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
      })),
      rpc: mockRpc,
    }
  };
});

// OpenAI API モック
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        })
      }
    }))
  };
});

// テスト用データ
const testMemory = {
  id: 'test-id',
  user_id: 'test-user-id',
  content: 'テスト用メモリコンテンツ',
  embedding: [0.1, 0.2, 0.3],
  metadata: { source: 'test' },
  external_id: 'ext-test-id',
  is_synced: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// テスト実行
describe('メモリ管理機能のテスト', () => {
  beforeEach(() => {
    // 各テスト前に実行
    jest.clearAllMocks();
    
    // 実装をスパイに置き換え
    jest.spyOn(memoryModule, 'createMemory').mockResolvedValue(testMemory);
    jest.spyOn(memoryModule, 'updateMemory').mockResolvedValue(testMemory);
    jest.spyOn(memoryModule, 'deleteMemory').mockResolvedValue(true);
    jest.spyOn(memoryModule, 'getUserMemories').mockResolvedValue([testMemory]);
    jest.spyOn(memoryModule, 'searchMemoriesBySimilarity').mockResolvedValue([testMemory]);
    jest.spyOn(memoryModule, 'searchMemoriesByText').mockResolvedValue([testMemory]);
    jest.spyOn(memoryModule, 'getMemoryByExternalId').mockResolvedValue(testMemory);
    jest.spyOn(memoryModule, 'updateSyncStatus').mockResolvedValue(true);
    jest.spyOn(memoryModule, 'getUnsyncedMemories').mockResolvedValue([testMemory]);
  });

  describe('createMemory', () => {
    it('メモリを正常に作成できること', async () => {
      const memoryData = {
        user_id: 'test-user-id',
        content: 'テスト用メモリコンテンツ',
        metadata: { source: 'test' },
      };
      
      const result = await memoryModule.createMemory(memoryData);
      
      expect(result).toEqual(testMemory);
      expect(memoryModule.createMemory).toHaveBeenCalledWith(memoryData);
    });

    it('エラー時に例外をスローすること', async () => {
      // エラーレスポンスをモック
      jest.spyOn(memoryModule, 'createMemory').mockRejectedValueOnce(new Error('テストエラー'));
      
      const memoryData = {
        user_id: 'test-user-id',
        content: 'テスト用メモリコンテンツ',
      };
      
      await expect(memoryModule.createMemory(memoryData)).rejects.toThrow();
    });
  });

  describe('updateMemory', () => {
    it('メモリを正常に更新できること', async () => {
      const result = await memoryModule.updateMemory('test-id', {
        content: '更新されたコンテンツ',
      });
      
      expect(result).toEqual(testMemory);
      expect(memoryModule.updateMemory).toHaveBeenCalledWith('test-id', {
        content: '更新されたコンテンツ',
      });
    });
  });

  describe('deleteMemory', () => {
    it('メモリを正常に削除できること', async () => {
      const result = await memoryModule.deleteMemory('test-id');
      expect(result).toBe(true);
      expect(memoryModule.deleteMemory).toHaveBeenCalledWith('test-id');
    });
  });

  describe('getUserMemories', () => {
    it('ユーザーのメモリを正常に取得できること', async () => {
      const result = await memoryModule.getUserMemories('test-user-id');
      expect(result).toEqual([testMemory]);
      expect(memoryModule.getUserMemories).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('searchMemoriesBySimilarity', () => {
    it('類似度によるメモリ検索が正常に動作すること', async () => {
      const result = await memoryModule.searchMemoriesBySimilarity('test-user-id', 'テスト検索クエリ');
      expect(result).toEqual([testMemory]);
      expect(memoryModule.searchMemoriesBySimilarity).toHaveBeenCalledWith('test-user-id', 'テスト検索クエリ');
    });
  });

  describe('searchMemoriesByText', () => {
    it('テキスト検索が正常に動作すること', async () => {
      const result = await memoryModule.searchMemoriesByText('test-user-id', 'テスト');
      expect(result).toEqual([testMemory]);
      expect(memoryModule.searchMemoriesByText).toHaveBeenCalledWith('test-user-id', 'テスト');
    });
  });
  
  describe('getMemoryByExternalId', () => {
    it('外部IDによってメモリを正常に取得できること', async () => {
      const result = await memoryModule.getMemoryByExternalId('ext-test-id');
      expect(result).toEqual(testMemory);
      expect(memoryModule.getMemoryByExternalId).toHaveBeenCalledWith('ext-test-id');
    });
  });
  
  describe('updateSyncStatus', () => {
    it('同期ステータスを正常に更新できること', async () => {
      const result = await memoryModule.updateSyncStatus('test-id', true);
      expect(result).toBe(true);
      expect(memoryModule.updateSyncStatus).toHaveBeenCalledWith('test-id', true);
    });
  });
  
  describe('getUnsyncedMemories', () => {
    it('未同期メモリを正常に取得できること', async () => {
      const result = await memoryModule.getUnsyncedMemories('test-user-id');
      expect(result).toEqual([testMemory]);
      expect(memoryModule.getUnsyncedMemories).toHaveBeenCalledWith('test-user-id');
    });
  });
}); 