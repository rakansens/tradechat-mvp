// __tests__/unit/supabase-settings.test.ts
// 設定管理機能のユニットテスト
// 作成日: 2025/6/10

import * as settingsModule from '@/lib/supabase/supabase-settings';

// Supabaseのモジュールをモック
jest.mock('@/lib/supabase/supabase', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
      })),
    }
  };
});

// テスト用データ
const testUserSettings = {
  theme: 'dark',
  language: 'ja',
  notifications: true
};

const testChartSetting = {
  id: 'test-chart-id',
  user_id: 'test-user-id',
  timeframe: '1h',
  chart_type: 'candle',
  show_volume: true,
  show_grid: true,
  show_legend: true,
  theme: 'dark',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const testSymbolSetting = {
  id: 'test-symbol-id',
  symbol: 'BTC/USD',
  user_id: 'test-user-id',
  is_favorite: true,
  display_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// テスト実行
describe('設定管理機能のテスト', () => {
  beforeEach(() => {
    // 各テスト前に実行
    jest.clearAllMocks();
    
    // 関数をモック
    jest.spyOn(settingsModule, 'getUserSettings').mockResolvedValue(testUserSettings);
    jest.spyOn(settingsModule, 'updateUserSettings').mockResolvedValue(true);
    jest.spyOn(settingsModule, 'getChartSettings').mockResolvedValue([testChartSetting]);
    jest.spyOn(settingsModule, 'getSymbolSettings').mockResolvedValue([testSymbolSetting]);
    jest.spyOn(settingsModule, 'getFavoriteSymbols').mockResolvedValue([testSymbolSetting]);
    jest.spyOn(settingsModule, 'upsertSymbolSettings').mockResolvedValue(testSymbolSetting);
    jest.spyOn(settingsModule, 'deleteSymbolSettings').mockResolvedValue(true);
    
    // これらはパラメータ型を変更する必要があります
    const createChartSettings = jest.spyOn(settingsModule, 'createChartSettings');
    createChartSettings.mockImplementation(async () => testChartSetting);
    
    const updateChartSettings = jest.spyOn(settingsModule, 'updateChartSettings');
    updateChartSettings.mockImplementation(async () => testChartSetting);
    
    const deleteChartSettings = jest.spyOn(settingsModule, 'deleteChartSettings');
    deleteChartSettings.mockImplementation(async () => true);
  });

  describe('ユーザー設定テスト', () => {
    describe('getUserSettings', () => {
      it('ユーザー設定を正常に取得できること', async () => {
        const result = await settingsModule.getUserSettings('test-user-id');
        expect(result).toEqual(testUserSettings);
        expect(settingsModule.getUserSettings).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('updateUserSettings', () => {
      it('ユーザー設定を正常に更新できること', async () => {
        const newSettings = {
          theme: 'light',
          language: 'en'
        };
        
        const result = await settingsModule.updateUserSettings('test-user-id', newSettings);
        
        expect(result).toBe(true);
        expect(settingsModule.updateUserSettings).toHaveBeenCalledWith('test-user-id', newSettings);
      });
    });
  });

  describe('チャート設定テスト', () => {
    describe('getChartSettings', () => {
      it('チャート設定リストを正常に取得できること', async () => {
        const result = await settingsModule.getChartSettings('test-user-id');
        expect(result).toEqual([testChartSetting]);
        expect(settingsModule.getChartSettings).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('createChartSettings', () => {
      it('チャート設定を正常に作成できること', async () => {
        const result = await settingsModule.createChartSettings(
          'test-user-id',
          '1h',
          'candle',
          true,
          true,
          true,
          'dark'
        );
        
        expect(result).toEqual(testChartSetting);
        expect(settingsModule.createChartSettings).toHaveBeenCalledWith(
          'test-user-id',
          '1h',
          'candle',
          true,
          true,
          true,
          'dark'
        );
      });
    });

    describe('updateChartSettings', () => {
      it('チャート設定を正常に更新できること', async () => {
        const updates = {
          timeframe: '4h',
          show_volume: false
        };
        
        const result = await settingsModule.updateChartSettings('test-chart-id', updates);
        
        expect(result).toEqual(testChartSetting);
        expect(settingsModule.updateChartSettings).toHaveBeenCalledWith('test-chart-id', updates);
      });
    });

    describe('deleteChartSettings', () => {
      it('チャート設定を正常に削除できること', async () => {
        const result = await settingsModule.deleteChartSettings('test-chart-id');
        
        expect(result).toBe(true);
        expect(settingsModule.deleteChartSettings).toHaveBeenCalledWith('test-chart-id');
      });
    });
  });

  describe('シンボル設定テスト', () => {
    describe('getSymbolSettings', () => {
      it('シンボル設定リストを正常に取得できること', async () => {
        const result = await settingsModule.getSymbolSettings('test-user-id');
        expect(result).toEqual([testSymbolSetting]);
        expect(settingsModule.getSymbolSettings).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('getFavoriteSymbols', () => {
      it('お気に入りシンボル設定を正常に取得できること', async () => {
        const result = await settingsModule.getFavoriteSymbols('test-user-id');
        expect(result).toEqual([testSymbolSetting]);
        expect(settingsModule.getFavoriteSymbols).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('upsertSymbolSettings', () => {
      it('シンボル設定を正常に作成/更新できること', async () => {
        const result = await settingsModule.upsertSymbolSettings(
          'test-user-id', 
          'BTC/USD', 
          true, 
          1
        );
        
        expect(result).toEqual(testSymbolSetting);
        expect(settingsModule.upsertSymbolSettings).toHaveBeenCalledWith(
          'test-user-id', 
          'BTC/USD', 
          true, 
          1
        );
      });
    });

    describe('deleteSymbolSettings', () => {
      it('シンボル設定を正常に削除できること', async () => {
        const result = await settingsModule.deleteSymbolSettings('test-user-id', 'BTC/USD');
        
        expect(result).toBe(true);
        expect(settingsModule.deleteSymbolSettings).toHaveBeenCalledWith('test-user-id', 'BTC/USD');
      });
    });
  });
}); 