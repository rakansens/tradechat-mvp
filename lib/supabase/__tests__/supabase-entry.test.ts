// lib/supabase/__tests__/supabase-entry.test.ts
// エントリー管理機能のユニットテスト
// 作成日: 2025/6/10
// 更新日: 2025/9/17 - DI対応に更新

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

// モックサポート関数：Supabaseレスポンスを模倣
const mockSupabaseResponse = (data: any = null, error: any = null) => ({
  data,
  error,
  select: () => mockSupabaseResponse(data, error),
  eq: () => mockSupabaseResponse(data, error),
  in: () => mockSupabaseResponse(data, error),
  match: () => mockSupabaseResponse(data, error),
  order: () => mockSupabaseResponse(data, error),
  limit: () => mockSupabaseResponse(data, error),
  range: () => mockSupabaseResponse(data, error),
  single: () => mockSupabaseResponse(data, error),
  insert: () => mockSupabaseResponse(data, error),
  update: () => mockSupabaseResponse(data, error),
  delete: () => mockSupabaseResponse(data, error),
});

// モックのSupabaseクライアント
const mockClient = {
  from: vi.fn().mockReturnValue(mockSupabaseResponse()),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(() => ({
      unsubscribe: vi.fn()
    })),
  }),
  removeChannel: vi.fn(),
};

// Supabaseクライアントのモック
vi.mock('@/lib/supabase/client', () => {
  return {
    createClient: vi.fn(() => mockClient)
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
  beforeEach(() => {
    // 各テスト前に実行
    vi.clearAllMocks();
    
    // デフォルトで成功レスポンスを設定
    mockClient.from.mockImplementation(() => 
      mockSupabaseResponse([testEntry], null)
    );
  });

  afterEach(() => {
    // 各テスト後に実行
    vi.clearAllMocks();
  });

  describe('getEntries', () => {
    it('エントリーリストを正常に取得できること', async () => {
      // DI対応でクライアントを直接渡す
      const result = await getEntries(50, 0, false, mockClient as any);
      expect(result).toEqual([testEntry]);
    });

    it('エラー時には例外をスローすること', async () => {
      const testError = { message: 'テストエラー' };
      mockClient.from.mockImplementation(() => 
        mockSupabaseResponse(null, testError)
      );
      
      await expect(getEntries(50, 0, false, mockClient as any))
        .rejects.toEqual(testError);
    });
  });

  describe('getUserEntries', () => {
    it('ユーザーのエントリーを正常に取得できること', async () => {
      const result = await getUserEntries('test-user-id', 50, 0, mockClient as any);
      expect(result).toEqual([testEntry]);
    });
  });

  describe('getEntriesBySymbol', () => {
    it('シンボルによるエントリーを正常に取得できること', async () => {
      const result = await getEntriesBySymbol('BTC/USD', 50, 0, false, mockClient as any);
      expect(result).toEqual([testEntry]);
    });
  });

  describe('getEntriesByStatus', () => {
    it('ステータスによるエントリーを正常に取得できること', async () => {
      const result = await getEntriesByStatus('open', 50, 0, false, mockClient as any);
      expect(result).toEqual([testEntry]);
    });
  });

  describe('createEntry', () => {
    it('エントリーを正常に作成できること', async () => {
      const now = new Date();
      const result = await createEntry(
        'test-user-id',
        'buy',
        'BTC/USD',
        50000,
        now,
        55000,
        48000,
        false,
        mockClient as any
      );
      
      expect(result).toEqual(testEntry);
    });
  });

  describe('updateEntry', () => {
    it('エントリーを正常に更新できること', async () => {
      const result = await updateEntry('test-entry-id', {
        take_profit: 56000,
        stop_loss: 47000,
      }, mockClient as any);
      
      expect(result).toEqual(testEntry);
    });
  });

  describe('deleteEntry', () => {
    it('エントリーを正常に削除できること', async () => {
      mockClient.from.mockImplementation(() => 
        mockSupabaseResponse([], null)
      );
      
      const result = await deleteEntry('test-entry-id', mockClient as any);
      expect(result).toBe(true);
    });
  });

  describe('closeEntry', () => {
    it('エントリーを正常にクローズできること', async () => {
      const now = new Date();
      const result = await closeEntry('test-entry-id', 52000, now, mockClient as any);
      expect(result).toEqual(testEntry);
    });
  });

  describe('subscribeToEntries', () => {
    it('エントリーのリアルタイム購読が正常に機能すること', () => {
      const callback = vi.fn();
      const unsubscribe = subscribeToEntries(callback, false, mockClient as any);
      
      expect(unsubscribe).toBeInstanceOf(Function);
      
      // 実際のチャンネル作成と購読が行われたか確認
      expect(mockClient.channel).toHaveBeenCalled();
      expect(mockClient.channel().on).toHaveBeenCalled();
      expect(mockClient.channel().subscribe).toHaveBeenCalled();
    });
  });
}); 