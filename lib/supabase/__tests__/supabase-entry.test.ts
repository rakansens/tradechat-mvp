// lib/supabase/__tests__/supabase-entry.test.ts
// エントリー管理機能のユニットテスト
// 作成日: 2025/6/10

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getEntries,
  getUserEntries,
  getEntriesBySymbol,
  getEntriesByStatus,
  createEntry,
  updateEntry,
  deleteEntry,
  closeEntry,
  subscribeToEntries
} from '../features/entry';

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
        in: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        data: null,
        error: null,
      })),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn((callback) => {
          callback('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        }),
      })),
      removeChannel: vi.fn(),
    }
  };
});

// テスト用データ
const testEntry = {
  id: 'test-entry-id',
  user_id: 'test-user-id',
  side: 'buy',
  symbol: 'BTC/USD',
  price: 50000,
  time: new Date().toISOString(),
  status: 'open',
  take_profit: 55000,
  stop_loss: 48000,
  exit_price: null,
  exit_time: null,
  profit: null,
};

// テスト実行
describe('エントリー管理機能のテスト', () => {
  let mockResponse: { data: any; error: any };

  beforeEach(() => {
    // 各テスト前に実行
    mockResponse = { data: null, error: null };
    
    // Supabaseモックのリセット
    const { supabase } = require('../supabase');
    
    // 成功レスポンスをデフォルトに設定
    supabase.from().insert.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().update.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().delete.mockImplementation(() => {
      mockResponse.data = [];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().eq.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().in.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().order.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
    
    supabase.from().select().order.range.mockImplementation(() => {
      mockResponse.data = [testEntry];
      return { ...mockResponse, data: mockResponse.data, error: mockResponse.error };
    });
  });

  afterEach(() => {
    // 各テスト後に実行
    vi.clearAllMocks();
  });

  describe('getEntries', () => {
    it('エントリーリストを正常に取得できること', async () => {
      const result = await getEntries();
      expect(result).toEqual([testEntry]);
    });

    it('エラー時には空配列を返すこと', async () => {
      const { supabase } = require('../supabase');
      
      supabase.from().select.mockImplementation(() => {
        mockResponse.error = { message: 'テストエラー' };
        return { ...mockResponse, data: null, error: mockResponse.error };
      });
      
      const result = await getEntries();
      expect(result).toEqual([]);
    });
  });

  describe('getUserEntries', () => {
    it('ユーザーのエントリーを正常に取得できること', async () => {
      const result = await getUserEntries('test-user-id');
      expect(result).toEqual([testEntry]);
    });
  });

  describe('getEntriesBySymbol', () => {
    it('シンボルによるエントリーを正常に取得できること', async () => {
      const result = await getEntriesBySymbol('BTC/USD');
      expect(result).toEqual([testEntry]);
    });
  });

  describe('getEntriesByStatus', () => {
    it('ステータスによるエントリーを正常に取得できること', async () => {
      const result = await getEntriesByStatus('open');
      expect(result).toEqual([testEntry]);
    });
  });

  describe('createEntry', () => {
    it('エントリーを正常に作成できること', async () => {
      const result = await createEntry({
        user_id: 'test-user-id',
        side: 'buy',
        symbol: 'BTC/USD',
        price: 50000,
        take_profit: 55000,
        stop_loss: 48000,
      });
      
      expect(result).toEqual(testEntry);
    });
  });

  describe('updateEntry', () => {
    it('エントリーを正常に更新できること', async () => {
      const result = await updateEntry('test-entry-id', {
        take_profit: 56000,
        stop_loss: 47000,
      });
      
      expect(result).toEqual(testEntry);
    });
  });

  describe('deleteEntry', () => {
    it('エントリーを正常に削除できること', async () => {
      const result = await deleteEntry('test-entry-id');
      expect(result).toBe(true);
    });
  });

  describe('closeEntry', () => {
    it('エントリーを正常にクローズできること', async () => {
      const result = await closeEntry('test-entry-id', 52000);
      expect(result).toEqual(testEntry);
    });
  });

  describe('subscribeToEntries', () => {
    it('エントリーのリアルタイム購読が正常に機能すること', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToEntries('test-user-id', callback);
      
      expect(unsubscribe).toBeInstanceOf(Function);
      
      // 実際のチャンネル作成と購読が行われたか確認
      const { supabase } = require('../supabase');
      expect(supabase.channel).toHaveBeenCalled();
      expect(supabase.channel().on).toHaveBeenCalled();
      expect(supabase.channel().subscribe).toHaveBeenCalled();
    });
  });
}); 