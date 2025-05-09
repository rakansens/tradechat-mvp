// __tests__/components/ChartContainer.test.tsx
// ChartContainer.tsxのテスト
//
// 主な機能:
// - instrumentTypeChangedイベントリスナーのテスト
// - 先物から現物への切り替え時の銘柄再設定のテスト
// - setExchangeType関数の呼び出しのテスト

import React from 'react';
import { render, act } from '@testing-library/react';
import { ChartContainer } from '../../components/chart/ChartContainer';
import { useAppStore } from '../../store';
import { logger } from '../../utils/logger';

// モック
jest.mock('../../store', () => ({
  useAppStore: jest.fn()
}));

jest.mock('../../store/chart', () => ({
  useChartConfigStore: jest.fn(() => ({
    chartType: 'candles',
    setChartType: jest.fn()
  })),
  useIndicatorStore: jest.fn(() => ({
    activeIndicators: [],
    toggleIndicator: jest.fn(),
    clearAllIndicators: jest.fn()
  })),
  useDrawingToolStore: jest.fn(() => ({
    activeDrawingTools: [],
    toggleDrawingTool: jest.fn(),
    clearAllDrawingTools: jest.fn()
  })),
  useRealTimeStore: jest.fn(() => ({
    useRealTimeData: false,
    toggleRealTimeData: jest.fn(),
    stopRealTimeUpdates: jest.fn()
  }))
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ChartContainer', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // useAppStoreのモック実装
    const mockSetExchangeType = jest.fn();
    const mockSetCurrentSymbol = jest.fn();
    
    (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        currentSymbol: 'BTCUSDT',
        currentTimeFrame: '1d',
        isLoadingChartData: false,
        chartError: null,
        chartData: [],
        exchangeType: 'futures',
        updateTimeFrame: jest.fn(),
        setCurrentSymbol: mockSetCurrentSymbol,
        fetchChartData: jest.fn(),
        setExchangeType: mockSetExchangeType
      };
      
      return selector(state);
    });
    
    // useAppStore.getStateのモック
    (useAppStore as any).getState = jest.fn(() => ({
      currentSymbol: 'BTCUSDT',
      setCurrentSymbol: mockSetCurrentSymbol,
      setExchangeType: mockSetExchangeType
    }));
  });
  
  describe('instrumentTypeChanged event', () => {
    it('先物から現物への切り替え時に正しく処理されること', () => {
      // コンポーネントをレンダリング
      render(<ChartContainer />);
      
      // instrumentTypeChangedイベントを発行
      const event = new CustomEvent('instrumentTypeChanged', {
        detail: {
          type: 'spot',
          fromType: 'futures'
        }
      });
      
      // イベントを発行
      act(() => {
        window.dispatchEvent(event);
      });
      
      // setExchangeTypeが呼ばれたことを確認
      expect(useAppStore.getState().setExchangeType).toHaveBeenCalledWith('spot');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('WebSocketから取引タイプ変更イベントを受信'),
        expect.objectContaining({
          component: 'ChartContainer',
          action: 'handleInstrumentTypeChange',
          fromFuturesToSpot: '先物→現物の切り替え検出'
        })
      );
      
      // setTimeout内の処理をテスト
      jest.runAllTimers();
      
      // setCurrentSymbolが呼ばれたことを確認
      expect(useAppStore.getState().setCurrentSymbol).toHaveBeenCalledWith(
        'BTCUSDT',
        '先物→現物切り替え後の銘柄再設定'
      );
    });
    
    it('現物から先物への切り替え時に正しく処理されること', () => {
      // useAppStoreのモックを上書き
      (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
        const state = {
          currentSymbol: 'ETHUSDT',
          currentTimeFrame: '1d',
          isLoadingChartData: false,
          chartError: null,
          chartData: [],
          exchangeType: 'spot',
          updateTimeFrame: jest.fn(),
          setCurrentSymbol: jest.fn(),
          fetchChartData: jest.fn(),
          setExchangeType: jest.fn()
        };
        
        return selector(state);
      });
      
      // コンポーネントをレンダリング
      render(<ChartContainer />);
      
      // instrumentTypeChangedイベントを発行
      const event = new CustomEvent('instrumentTypeChanged', {
        detail: {
          type: 'futures',
          fromType: 'spot'
        }
      });
      
      // イベントを発行
      act(() => {
        window.dispatchEvent(event);
      });
      
      // setExchangeTypeが呼ばれたことを確認
      expect(useAppStore.getState().setExchangeType).toHaveBeenCalledWith('futures');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('WebSocketから取引タイプ変更イベントを受信'),
        expect.objectContaining({
          component: 'ChartContainer',
          action: 'handleInstrumentTypeChange',
          fromFuturesToSpot: '他の切り替えパターン'
        })
      );
      
      // setTimeout内の処理をテスト
      jest.runAllTimers();
      
      // 現物→先物の場合はsetCurrentSymbolが呼ばれないことを確認
      expect(useAppStore.getState().setCurrentSymbol).not.toHaveBeenCalled();
    });
  });
  
  describe('handleExchangeTypeChange', () => {
    it('取引種別変更ハンドラーが正しく動作すること', () => {
      // コンポーネントをレンダリング
      const { container } = render(<ChartContainer />);
      
      // 取引種別変更ボタンを取得
      const spotButton = container.querySelector('.exchange-type-selector button:first-child');
      
      // ボタンをクリック
      if (spotButton) {
        act(() => {
          spotButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        });
      }
      
      // setExchangeTypeが呼ばれたことを確認
      expect(useAppStore.getState().setExchangeType).toHaveBeenCalledWith('spot');
    });
  });
});