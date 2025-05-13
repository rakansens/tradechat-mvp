/**
 * __tests__/chart/useChartCore.test.ts
 * チャートコアHookのテスト
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useChartCore } from '@/hooks/chart';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';
import { waitFor } from '@testing-library/react';

// モック
jest.mock('lightweight-charts', () => {
  // モックシリーズ
  const mockSeries = {
    setData: jest.fn(),
    applyOptions: jest.fn(),
  };
  
  // モックタイムスケール
  const mockTimeScale = {
    fitContent: jest.fn(),
    subscribeVisibleLogicalRangeChange: jest.fn(),
  };
  
  // モックチャート
  const mockChart = {
    resize: jest.fn(),
    addSeries: jest.fn().mockReturnValue(mockSeries),
    timeScale: jest.fn().mockReturnValue(mockTimeScale),
    removeSeries: jest.fn(),
    remove: jest.fn(),
  };
  
  return {
    createChart: jest.fn().mockReturnValue(mockChart),
    CandlestickSeries: 'CandlestickSeries',
    LineSeries: 'LineSeries',
    AreaSeries: 'AreaSeries',
    ColorType: {
      Solid: 'solid',
    },
  };
});

// ロガーをモック
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('useChartCore', () => {
  // ResizeObserverをモック
  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
  
  // グローバルにResizeObserverをモック
  global.ResizeObserver = mockResizeObserver;
  
  // getBoundingClientRectをモック
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON: jest.fn(),
  }));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('チャートインスタンスが初期化される', () => {
    const { result } = renderHook(() => useChartCore());
    
    // createChartが呼ばれていることを検証
    expect(createChart).toHaveBeenCalled();
    
    // フックの戻り値が正しい形式であることを検証
    expect(result.current).toHaveProperty('chartRef');
    expect(result.current).toHaveProperty('chartInstanceRef');
    expect(result.current).toHaveProperty('seriesRefs');
    expect(result.current).toHaveProperty('resizeChart');
    expect(result.current).toHaveProperty('updateChartData');
  });

  test('updateChartDataがデータを更新する', () => {
    const { result } = renderHook(() => useChartCore());
    
    // テスト用のデータを作成
    const testData: OHLCData[] = [
      { time: 1625100000000, open: 100, high: 110, low: 90, close: 105 },
      { time: 1625110000000, open: 105, high: 115, low: 95, close: 110 },
    ];
    
    // chartInstanceRefをモックにセット
    const mockChartInstance = {
      resize: jest.fn(),
      timeScale: jest.fn().mockReturnValue({
        fitContent: jest.fn(),
      }),
    };
    
    // キャンドルシリーズをモック
    const mockCandleSeries = {
      setData: jest.fn(),
    };
    
    // refの値を直接設定
    result.current.chartInstanceRef.current = mockChartInstance as unknown as IChartApi;
    result.current.seriesRefs.candleSeries.current = mockCandleSeries as unknown as ISeriesApi<"Candlestick">;
    
    // updateChartDataを呼び出し
    act(() => {
      result.current.updateChartData(testData, 'candles');
    });
    
    // setDataが呼ばれていることを検証
    expect(mockCandleSeries.setData).toHaveBeenCalledTimes(1);
    
    // fitContentが呼ばれていることを検証
    expect(mockChartInstance.timeScale().fitContent).toHaveBeenCalledTimes(1);
  });

  test('resizeChartがチャートサイズを更新する', () => {
    const { result } = renderHook(() => useChartCore());
    
    // mockChartInstanceを作成
    const mockChartInstance = {
      resize: jest.fn(),
    };
    
    // refの値を直接設定
    result.current.chartInstanceRef.current = mockChartInstance as unknown as IChartApi;
    result.current.chartRef.current = document.createElement('div');
    
    // resizeChartを呼び出し
    act(() => {
      result.current.resizeChart();
    });
    
    // resizeが呼ばれていることを検証
    expect(mockChartInstance.resize).toHaveBeenCalledTimes(1);
    expect(mockChartInstance.resize).toHaveBeenCalledWith(800, 600);
  });
}); 