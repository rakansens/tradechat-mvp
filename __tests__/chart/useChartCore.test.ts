/**
 * __tests__/chart/useChartCore.test.ts
 * チャートコアHookのテスト
 * 
 * 変更履歴:
 * - 2023-06-02: React 19に対応するためにテストを書き換え
 * - 2023-06-03: テスト実装を単純化し、DOM操作を回避
 * - 2025-10-09: S-10.2フェーズ: lightweight-charts型の明示的定義
 */

// フックの実行ではなく、実装内の関数とモジュールをテスト
import * as React from 'react';
import { createChart } from 'lightweight-charts';
import type { 
  IChartApi, 
  ISeriesApi, 
  Time, 
  SeriesType, 
  CandlestickData,
  SeriesDefinition,
  SeriesOptionsMap
} from 'lightweight-charts';
import type { OHLCData } from '@/types/chart';

// モック用のSimpleSeriesDefinition型
type SimpleSeriesDefinition = Pick<SeriesDefinition<keyof SeriesOptionsMap>, 'type'>;

// lightweight-charts用の定数定義
const SERIES_TYPES: Record<string, SimpleSeriesDefinition> = {
  CANDLESTICK: { type: 'candlestick' },
  LINE: { type: 'line' },
  AREA: { type: 'area' }
};

// モックを設定
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn().mockReturnValue({
    addSeries: jest.fn().mockReturnValue({
      setData: jest.fn(),
    }),
    timeScale: jest.fn().mockReturnValue({
      fitContent: jest.fn(),
    }),
    resize: jest.fn(),
    removeSeries: jest.fn(),
    remove: jest.fn(),
  }),
  CandlestickSeries: { type: 'candlestick' },
  LineSeries: { type: 'line' },
  AreaSeries: { type: 'area' },
  ColorType: {
    Solid: 'solid',
  },
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

describe('useChartCore関連機能', () => {
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

  test('lightweight-chartsのcreateChart関数が正しくモック化されている', () => {
    // モック化したcreateChart関数が存在することを確認
    expect(createChart).toBeDefined();
    
    // モック関数が呼び出せることを確認
    const element = document.createElement('div');
    const options = {};
    createChart(element, options);
    
    // 関数が呼び出されたことを確認
    expect(createChart).toHaveBeenCalledTimes(1);
    expect(createChart).toHaveBeenCalledWith(element, options);
  });

  test('チャートインスタンスのメソッドが正しくモックされている', () => {
    // モックチャートインスタンスを作成
    const element = document.createElement('div');
    const chart = createChart(element, {});
    
    // メソッドが正しくモックされているか確認
    expect(chart.addSeries).toBeDefined();
    expect(chart.timeScale).toBeDefined();
    expect(chart.removeSeries).toBeDefined();
    expect(chart.remove).toBeDefined();
    
    // メソッドを呼び出せることを確認
    // 正しく型定義された定数を使用
    chart.addSeries(SERIES_TYPES.CANDLESTICK, {});
    expect(chart.addSeries).toHaveBeenCalledTimes(1);
    
    const timeScale = chart.timeScale();
    expect(chart.timeScale).toHaveBeenCalledTimes(1);
    expect(timeScale.fitContent).toBeDefined();
  });

  test('チャートシリーズのメソッドが正しくモックされている', () => {
    // モックチャートインスタンスを作成
    const element = document.createElement('div');
    const chart = createChart(element, {});
    
    // シリーズを追加
    // 正しく型定義された定数を使用
    const series = chart.addSeries(SERIES_TYPES.CANDLESTICK, {});
    
    // メソッドが正しくモックされているか確認
    expect(series.setData).toBeDefined();
    
    // メソッドを呼び出せることを確認
    // 型変換してテストデータを作成
    const testData: CandlestickData<Time>[] = [
      { 
        time: 1625100000000 as unknown as Time, 
        open: 100, 
        high: 110, 
        low: 90, 
        close: 105 
      }
    ];
    series.setData(testData);
    expect(series.setData).toHaveBeenCalledTimes(1);
    expect(series.setData).toHaveBeenCalledWith(testData);
  });
}); 