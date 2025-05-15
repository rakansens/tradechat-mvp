// __tests__/unit/supabase/entry.test.ts
// Supabase エントリー関連機能のテスト
// 作成日: 2023/6/25
// 更新日: 2023/6/25 - 型エラーを修正

import { getOpenEntries, getEntriesByStatus, Entry } from '@/lib/supabase/features/entry';
import { createClient } from '@/lib/supabase/client';

// createClientのモック
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              data: null,
              error: null,
            }))
          }))
        }))
      }))
    }))
  }))
}));

// unstable_cacheのモック
jest.mock('next/cache', () => ({
  unstable_cache: (fn: Function, keys: string[], options: any) => fn
}));

describe('Entry Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOpenEntries', () => {
    it('should fetch open entries with caching', async () => {
      // モックの戻り値を設定
      const mockEntries: Entry[] = [
        {
          id: '1',
          user_id: 'user1',
          symbol: 'BTC/USD',
          side: 'buy',
          price: 50000,
          time: '2023-06-25T10:00:00Z',
          status: 'open',
          created_at: '2023-06-25T10:00:00Z',
          updated_at: null,
          exit_price: null,
          exit_time: null,
          is_public: false,
          profit: null,
          stop_loss: null,
          take_profit: null
        },
        {
          id: '2',
          user_id: 'user2',
          symbol: 'ETH/USD',
          side: 'sell',
          price: 3000,
          time: '2023-06-25T11:00:00Z',
          status: 'open',
          created_at: '2023-06-25T11:00:00Z',
          updated_at: null,
          exit_price: null,
          exit_time: null,
          is_public: false,
          profit: null,
          stop_loss: null,
          take_profit: null
        }
      ];

      // スパイ関数の戻り値を設定
      const getEntriesByStatusSpy = jest.spyOn(
        { getEntriesByStatus },
        'getEntriesByStatus'
      ).mockResolvedValue(mockEntries);

      // 関数を実行
      const result = await getOpenEntries();

      // 検証
      expect(getEntriesByStatusSpy).toHaveBeenCalledWith('open', 50, 0, false);
      expect(result).toEqual(mockEntries);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('open');

      // スパイをリストア
      getEntriesByStatusSpy.mockRestore();
    });

    it('should fetch public open entries', async () => {
      // モックの戻り値を設定
      const mockPublicEntries: Entry[] = [
        {
          id: '1',
          user_id: 'user1',
          symbol: 'BTC/USD',
          side: 'buy',
          price: 50000,
          time: '2023-06-25T10:00:00Z',
          status: 'open',
          is_public: true,
          created_at: '2023-06-25T10:00:00Z',
          updated_at: null,
          exit_price: null,
          exit_time: null,
          profit: null,
          stop_loss: null,
          take_profit: null
        }
      ];

      // スパイ関数の戻り値を設定
      const getEntriesByStatusSpy = jest.spyOn(
        { getEntriesByStatus },
        'getEntriesByStatus'
      ).mockResolvedValue(mockPublicEntries);

      // 関数を実行（公開エントリーのみ）
      const result = await getOpenEntries(true);

      // 検証
      expect(getEntriesByStatusSpy).toHaveBeenCalledWith('open', 50, 0, true);
      expect(result).toEqual(mockPublicEntries);
      expect(result.length).toBe(1);
      expect(result[0].is_public).toBe(true);

      // スパイをリストア
      getEntriesByStatusSpy.mockRestore();
    });

    it('should handle empty results', async () => {
      // 空の結果をモック
      const getEntriesByStatusSpy = jest.spyOn(
        { getEntriesByStatus },
        'getEntriesByStatus'
      ).mockResolvedValue([]);

      // 関数を実行
      const result = await getOpenEntries();

      // 検証
      expect(getEntriesByStatusSpy).toHaveBeenCalledWith('open', 50, 0, false);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);

      // スパイをリストア
      getEntriesByStatusSpy.mockRestore();
    });

    it('should propagate errors', async () => {
      // エラーをモック
      const mockError = new Error('Database connection error');
      const getEntriesByStatusSpy = jest.spyOn(
        { getEntriesByStatus },
        'getEntriesByStatus'
      ).mockRejectedValue(mockError);

      // 関数を実行して例外を検証
      await expect(getOpenEntries()).rejects.toThrow('Database connection error');

      // スパイをリストア
      getEntriesByStatusSpy.mockRestore();
    });
  });
}); 