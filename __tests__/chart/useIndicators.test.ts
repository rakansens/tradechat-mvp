/**
 * __tests__/chart/useIndicators.test.ts
 * チャートインジケーターHookのテスト
 */

import { renderHook } from '@testing-library/react-hooks';
import { useIndicators } from '@/hooks/chart';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';
import { jest } from '@jest/globals';

// useIndicatorStoreをモック
jest.mock('@/store', () => ({
  useIndicatorStore: () => ({
    activeIndicators: [
      { type: 'rsi', params: { period: 14 } }
    ]
  })
}));

// RSI系モジュールをモック
jest.mock('@/components/chart/indicators', () => ({
  RSI: {
    addOrUpdate: jest.fn(),
    remove: jest.fn(),
  },
  MACD: {
    addOrUpdate: jest.fn(),
    remove: jest.fn(),
  },
  MacdSeriesRefs: {},
  calculateIchimokuData: jest.fn(),
  addOrUpdateIchimokuSeries: jest.fn(),
  removeIchimokuSeries: jest.fn(),
}));

// ロガーをモック
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('useIndicators', () => {
  let mockChartInstance: Partial<IChartApi>;
  let mockSeries: Partial<ISeriesApi<any>>;
  let testData: OHLCData[];
  
  beforeEach(() => {
    // モックをクリア
    jest.clearAllMocks();
    
    // テスト用のモックオブジェクトを作成
    mockChartInstance = {
      timeScale: jest.fn().mockReturnValue({
        fitContent: jest.fn(),
      }),
    };
    
    mockSeries = {
      setData: jest.fn(),
    };
    
    // テスト用のデータを作成
    testData = [
      { time: 1625100000000, open: 100, high: 110, low: 90, close: 105 },
      { time: 1625110000000, open: 105, high: 115, low: 95, close: 110 },
      { time: 1625120000000, open: 110, high: 120, low: 100, close: 115 },
      { time: 1625130000000, open: 115, high: 125, low: 105, close: 120 },
      { time: 1625140000000, open: 120, high: 130, low: 110, close: 125 },
    ];
  });
  
  test('useIndicatorsが正しいインターフェースを提供する', () => {
    const { result } = renderHook(() => useIndicators());
    
    // 戻り値の形式を検証
    expect(result.current).toHaveProperty('indicatorRefs');
    expect(result.current).toHaveProperty('updateIndicators');
    expect(result.current).toHaveProperty('clearAllIndicators');
    
    // 参照が初期化されていることを検証
    expect(result.current.indicatorRefs.rsiSeries.current).toBeNull();
    expect(result.current.indicatorRefs.macdSeries).toBeDefined();
    expect(result.current.indicatorRefs.tenkanSeries.current).toBeNull();
  });
  
  test('updateIndicatorsがインジケーターを更新する', () => {
    const { result } = renderHook(() => useIndicators());
    
    // updateIndicatorsを実行
    result.current.updateIndicators(
      mockChartInstance as IChartApi,
      testData
    );
    
    // アクティブなインジケーター（RSI）が追加されたことを検証
    expect(require('@/components/chart/indicators').RSI.addOrUpdate).toHaveBeenCalledTimes(1);
    
    // 他のインジケーターは呼び出されていないことを検証
    expect(require('@/components/chart/indicators').MACD.addOrUpdate).not.toHaveBeenCalled();
    expect(require('@/components/chart/indicators').addOrUpdateIchimokuSeries).not.toHaveBeenCalled();
  });
  
  test('clearAllIndicatorsがすべてのインジケーターをクリアする', () => {
    const { result } = renderHook(() => useIndicators());
    
    // rsiSeriesに値をセット
    result.current.indicatorRefs.rsiSeries.current = mockSeries as ISeriesApi<'Line'>;
    
    // clearAllIndicatorsを実行
    result.current.clearAllIndicators(mockChartInstance as IChartApi);
    
    // RSI.removeが呼ばれたことを検証
    expect(require('@/components/chart/indicators').RSI.remove).toHaveBeenCalledTimes(1);
    
    // 他のクリア関数は呼ばれていないことを検証（インジケーターがなかったため）
    expect(require('@/components/chart/indicators').MACD.remove).not.toHaveBeenCalled();
    expect(require('@/components/chart/indicators').removeIchimokuSeries).not.toHaveBeenCalled();
  });
}); 