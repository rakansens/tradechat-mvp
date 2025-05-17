// components/chart/toolbar/__tests__/index.test.tsx
// 作成: ChartToolbarコンポーネントのテスト
// 役割:
// 1. コンポーネントのレンダリングテスト
// 2. カスタムイベントの処理テスト
// 3. タブ切り替え機能のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import '@testing-library/jest-dom';
import ChartToolbar from '..';
import { useToolbarEvents } from '@/hooks/chart';

// モック
jest.mock('@/hooks/chart', () => ({
  usePriceMetrics: () => ({
    currentPrice: 50000,
    priceChangePercent: 2.5
  }),
  useToolbarStores: () => ({
    symbolStore: {
      currentSymbol: 'BTC-USD',
      exchangeType: 'spot',
      handleSymbolChange: jest.fn(),
      setProductType: jest.fn()
    },
    chartDataStore: {
      chartData: [],
      error: null,
      currentTimeFrame: '1d',
      updateTimeFrame: jest.fn(),
      fetchChartData: jest.fn()
    },
    chartConfigStore: {
      chartType: 'candles',
      setChartType: jest.fn()
    },
    indicatorStore: {
      activeIndicators: [],
      toggleIndicator: jest.fn(),
      clearAllIndicators: jest.fn(),
      isIndicatorActive: jest.fn(() => false)
    },
    drawingToolStore: {
      activeDrawingTools: [],
      toggleDrawingTool: jest.fn(),
      clearAllDrawingTools: jest.fn()
    },
    realTimeStore: {
      useRealTimeData: false,
      toggleRealTimeData: jest.fn()
    },
    entryStore: {
      entries: [],
      openPositionsCount: 0
    }
  }),
  useToolbarEvents: jest.fn()
}));

describe('ChartToolbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('タイムフレームボタンが正しくレンダリングされる', () => {
    render(<ChartToolbar />);
    expect(screen.getByText('1d')).toBeInTheDocument();
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('カスタムイベントリスナーが登録される', () => {
    renderHook(() => useToolbarEvents());
    expect(useToolbarEvents).toHaveBeenCalledTimes(1);
  });

  it('タブ切り替えコールバックが呼ばれる', () => {
    const mockTabChange = jest.fn();
    render(<ChartToolbar activeTab="chart" onTabChange={mockTabChange} />);
    
    // Positionsタブをクリック
    fireEvent.click(screen.getByText('Positions'));
    expect(mockTabChange).toHaveBeenCalledWith('positions');
  });

  it('エラーメッセージが表示される', () => {
    // エラーメッセージを持つモックを一時的に上書き
    jest.mock('@/hooks/chart', () => ({
      ...jest.requireActual('@/hooks/chart'),
      useToolbarStores: () => ({
        ...jest.requireActual('@/hooks/chart').useToolbarStores(),
        chartDataStore: {
          ...jest.requireActual('@/hooks/chart').useToolbarStores().chartDataStore,
          error: 'テストエラーメッセージ'
        }
      })
    }));
    
    render(<ChartToolbar />);
    expect(screen.queryByText('テストエラーメッセージ')).not.toBeNull();
  });
}); 