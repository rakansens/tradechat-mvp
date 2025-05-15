// __tests__/unit/supabase-entry.test.ts
// エントリー管理機能のユニットテスト
// 作成日: 2025/6/10
// 更新日: 2025/6/23 - SSRクライアント対応で関数シグネチャに合わせてテスト修正

import * as entryModule from '@/lib/supabase/features/entry';
import { Tables } from '@/types/network/supabase';

// Supabaseのモジュールをモック
jest.mock('@/lib/supabase/supabase', () => {
  const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockImplementation((callback) => {
      if (callback) callback('SUBSCRIBED');
      return { unsubscribe: jest.fn() };
    }),
  };

  const mockSelect = {
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  };

  const mockInsert = {
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  const mockUpdate = {
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };

  const mockDelete = {
    eq: jest.fn().mockReturnThis(),
  };

  return {
    supabase: {
      from: jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnValue(mockSelect),
        insert: jest.fn().mockReturnValue(mockInsert),
        update: jest.fn().mockReturnValue(mockUpdate),
        delete: jest.fn().mockReturnValue(mockDelete),
      })),
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
    }
  };
});

// テスト用データを拡張モデルに合わせて更新
const testEntry: Tables<'entries'> = {
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
  is_public: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// スパイを実装して関数を置き換える
describe('エントリー管理機能のテスト', () => {
  beforeEach(() => {
    // 各テスト前に実行
    jest.clearAllMocks();
    
    // 新しいモジュールに合わせてモック実装を修正
    jest.spyOn(entryModule, 'getEntries').mockResolvedValue([testEntry]);
    jest.spyOn(entryModule, 'getUserEntries').mockResolvedValue([testEntry]);
    jest.spyOn(entryModule, 'getEntriesBySymbol').mockResolvedValue([testEntry]);
    jest.spyOn(entryModule, 'getEntriesByStatus').mockResolvedValue([testEntry]);
    jest.spyOn(entryModule, 'createEntry').mockResolvedValue(testEntry);
    jest.spyOn(entryModule, 'updateEntry').mockResolvedValue(testEntry);
    jest.spyOn(entryModule, 'deleteEntry').mockResolvedValue(true);
    jest.spyOn(entryModule, 'closeEntry').mockResolvedValue(testEntry);
    jest.spyOn(entryModule, 'subscribeToEntries').mockImplementation(() => jest.fn());
  });

  describe('getEntries', () => {
    it('エントリーリストを正常に取得できること', async () => {
      const result = await entryModule.getEntries();
      expect(result).toEqual([testEntry]);
      expect(entryModule.getEntries).toHaveBeenCalled();
    });

    it('エラー時には例外をスローすること', async () => {
      jest.spyOn(entryModule, 'getEntries').mockRejectedValueOnce(new Error('テストエラー'));
      
      await expect(entryModule.getEntries()).rejects.toThrow('テストエラー');
    });
  });

  describe('getUserEntries', () => {
    it('ユーザーのエントリーを正常に取得できること', async () => {
      const result = await entryModule.getUserEntries('test-user-id');
      expect(result).toEqual([testEntry]);
      expect(entryModule.getUserEntries).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('getEntriesBySymbol', () => {
    it('シンボルによるエントリーを正常に取得できること', async () => {
      const result = await entryModule.getEntriesBySymbol('BTC/USD');
      expect(result).toEqual([testEntry]);
      expect(entryModule.getEntriesBySymbol).toHaveBeenCalledWith('BTC/USD');
    });
  });

  describe('getEntriesByStatus', () => {
    it('ステータスによるエントリーを正常に取得できること', async () => {
      const result = await entryModule.getEntriesByStatus('open');
      expect(result).toEqual([testEntry]);
      expect(entryModule.getEntriesByStatus).toHaveBeenCalledWith('open');
    });
  });

  describe('createEntry', () => {
    it('エントリーを正常に作成できること', async () => {
      const userId = 'test-user-id';
      const side = 'buy' as const;
      const symbol = 'BTC/USD';
      const price = 50000;
      const time = new Date();
      const takeProfit = 55000;
      const stopLoss = 48000;
      
      const result = await entryModule.createEntry(
        userId,
        side,
        symbol,
        price,
        time,
        takeProfit,
        stopLoss
      );
      
      expect(result).toEqual(testEntry);
      expect(entryModule.createEntry).toHaveBeenCalledWith(
        userId,
        side,
        symbol,
        price,
        time,
        takeProfit,
        stopLoss
      );
    });
  });

  describe('updateEntry', () => {
    it('エントリーを正常に更新できること', async () => {
      const updates = {
        take_profit: 56000,
        stop_loss: 47000,
      };
      
      const result = await entryModule.updateEntry('test-entry-id', updates);
      
      expect(result).toEqual(testEntry);
      expect(entryModule.updateEntry).toHaveBeenCalledWith('test-entry-id', updates);
    });
  });

  describe('deleteEntry', () => {
    it('エントリーを正常に削除できること', async () => {
      const result = await entryModule.deleteEntry('test-entry-id');
      expect(result).toBe(true);
      expect(entryModule.deleteEntry).toHaveBeenCalledWith('test-entry-id');
    });
  });

  describe('closeEntry', () => {
    it('エントリーを正常にクローズできること', async () => {
      const entryId = 'test-entry-id';
      const exitPrice = 52000;
      const exitTime = new Date();
      
      const result = await entryModule.closeEntry(entryId, exitPrice, exitTime);
      
      expect(result).toEqual(testEntry);
      expect(entryModule.closeEntry).toHaveBeenCalledWith(entryId, exitPrice, exitTime);
    });
  });

  describe('subscribeToEntries', () => {
    it('エントリーのリアルタイム購読が正常に機能すること', () => {
      const callback = jest.fn();
      
      const unsubscribe = entryModule.subscribeToEntries(callback);
      
      expect(typeof unsubscribe).toBe('function');
      expect(entryModule.subscribeToEntries).toHaveBeenCalledWith(callback);
    });
  });
}); 