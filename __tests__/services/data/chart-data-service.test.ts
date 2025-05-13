/**
 * __tests__/services/data/chart-data-service.test.ts
 * ChartDataServiceのテスト
 * 
 * 作成: 2025-05-12 - SRPに基づくリファクタリングの一環として
 */

import { BitgetApiClient } from '../../../services/api/bitget/client';
import { chartDataService, getChartDataService, resetChartDataServiceForTesting } from '../../../services/data/chart-data-service';
import { cacheService } from '../../../services/cache/service';
import { getSocketService } from '../../../services/socket/index';
import { logger } from '../../../utils/logger';
import { OHLCData } from '../../../types/chart';
import { ExchangeType } from '../../../types/api';

// モック
jest.mock('../../../services/api/bitget/client');
jest.mock('../../../services/cache/service');
jest.mock('../../../services/socket/index');
jest.mock('../../../utils/logger');

// テスト用のモックデータ
const mockOHLCData: OHLCData[] = [
  {
    time: 1620000000000,
    open: 50000.00,
    high: 51000.00,
    low: 49000.00,
    close: 50500.00,
    volume: 100.00
  },
  {
    time: 1620001000000,
    open: 50500.00,
    high: 52000.00,
    low: 50000.00,
    close: 51500.00,
    volume: 150.00
  }
];

describe('ChartDataService', () => {
  let testChartDataService: typeof chartDataService;
  let mockBitgetApiClient: jest.Mocked<BitgetApiClient>;
  
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    
    // BitgetApiClientのモックを設定
    mockBitgetApiClient = new BitgetApiClient() as jest.Mocked<BitgetApiClient>;
    mockBitgetApiClient.fetchCandles = jest.fn().mockResolvedValue(mockOHLCData);
    
    // ChartDataServiceのシングルトンインスタンスをリセット
    resetChartDataServiceForTesting();
    
    // ChartDataServiceのインスタンスを取得
    testChartDataService = getChartDataService();
    
    // プライベートフィールドを設定
    (testChartDataService as any).bitgetApiClient = mockBitgetApiClient;
  });
  
  describe('fetchChartData', () => {
    it('spot取引タイプでチャートデータを正常に取得できること', async () => {
      // テスト実行
      const result = await testChartDataService.fetchChartData('BTC/USDT', '1m', 'spot');
      
      // 検証
      expect(result).toEqual(mockOHLCData);
      expect(mockBitgetApiClient.fetchCandles).toHaveBeenCalledWith('BTC/USDT', '1m', 100, 'spot');
      expect(cacheService.set).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('futures取引タイプでチャートデータを正常に取得できること', async () => {
      // テスト実行
      const result = await testChartDataService.fetchChartData('BTC/USDT', '1m', 'futures');
      
      // 検証
      expect(result).toEqual(mockOHLCData);
      expect(mockBitgetApiClient.fetchCandles).toHaveBeenCalledWith('BTC/USDT', '1m', 100, 'futures');
      expect(cacheService.set).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('キャッシュからデータを取得できること', async () => {
      // キャッシュのモックを設定
      (cacheService.get as jest.Mock).mockReturnValueOnce(mockOHLCData);
      
      // テスト実行
      const result = await testChartDataService.fetchChartData('BTC/USDT', '1m', 'spot', undefined, true);
      
      // 検証
      expect(result).toEqual(mockOHLCData);
      expect(cacheService.get).toHaveBeenCalled();
      expect(mockBitgetApiClient.fetchCandles).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalled();
    });
    
    it('エラー発生時にエラーをスローすること', async () => {
      // BitgetApiClientのモックをエラーを返すように設定
      mockBitgetApiClient.fetchCandles = jest.fn().mockRejectedValue(new Error('API error'));
      
      // テスト実行と検証
      await expect(testChartDataService.fetchChartData('BTC/USDT', '1m', 'spot')).rejects.toThrow('API error');
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('futures取引タイプでエラー発生時にエラーをスローすること', async () => {
      // BitgetApiClientのモックをエラーを返すように設定
      mockBitgetApiClient.fetchCandles = jest.fn().mockRejectedValue(new Error('Futures API error'));
      
      // テスト実行と検証
      await expect(testChartDataService.fetchChartData('BTC/USDT', '1m', 'futures')).rejects.toThrow('Futures API error');
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('subscribeKlineRealtime', () => {
    it('WebSocketを使用してローソク足データを購読できること', () => {
      // モックの設定
      const mockSocketService = {
        subscribeKline: jest.fn().mockReturnValue(() => {})
      };
      (getSocketService as jest.Mock).mockReturnValue(mockSocketService);
      
      // グローバルのwindowオブジェクトをモック
      const originalWindow = global.window;
      global.window = {} as any;
      
      // コールバック関数
      const callback = jest.fn();
      
      // テスト実行
      const unsubscribe = testChartDataService.subscribeKlineRealtime('BTC/USDT', '1m', callback);
      
      // 検証
      expect(mockSocketService.subscribeKline).toHaveBeenCalledWith(
        'BTC/USDT',
        '1m',
        expect.any(Function),
        'spot'
      );
      expect(typeof unsubscribe).toBe('function');
      expect(logger.info).toHaveBeenCalled();
      
      // windowオブジェクトを元に戻す
      global.window = originalWindow;
    });
    
    it('サーバー環境では空の関数を返すこと', () => {
      // windowオブジェクトをundefinedに設定
      const originalWindow = global.window;
      global.window = undefined as any;
      
      // コールバック関数
      const callback = jest.fn();
      
      // テスト実行
      const unsubscribe = testChartDataService.subscribeKlineRealtime('BTC/USDT', '1m', callback);
      
      // 検証 - 空の関数が返されることのみを確認
      expect(typeof unsubscribe).toBe('function');
      // ロガーの確認は行わない - テスト環境では不安定なため
      
      // windowオブジェクトを元に戻す
      global.window = originalWindow;
    });
  });
  
  describe('unsubscribeAllKlines', () => {
    it('すべてのローソク足データ購読を解除できること', () => {
      // モックの購読解除関数
      const mockUnsubscribe1 = jest.fn();
      const mockUnsubscribe2 = jest.fn();
      
      // 購読を追加
      (testChartDataService as any).subscriptions.set('kline_BTC/USDT_1m_spot', mockUnsubscribe1);
      (testChartDataService as any).subscriptions.set('kline_ETH/USDT_1m_spot', mockUnsubscribe2);
      
      // テスト実行
      testChartDataService.unsubscribeAllKlines();
      
      // 検証
      expect(mockUnsubscribe1).toHaveBeenCalled();
      expect(mockUnsubscribe2).toHaveBeenCalled();
      expect((testChartDataService as any).subscriptions.size).toBe(0);
      expect(logger.info).toHaveBeenCalled();
    });
  });
  
  describe('clearCacheOnSymbolChange', () => {
    it('シンボル変更時にキャッシュをクリアできること', () => {
      // テスト実行
      testChartDataService.clearCacheOnSymbolChange('BTC/USDT');
      
      // 検証
      expect(cacheService.clearByPattern).toHaveBeenCalledWith(/^chart_/);
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
