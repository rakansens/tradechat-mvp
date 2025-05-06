// hooks/useChartToolbar.ts
// 作成: ChartToolbarコンポーネントの状態管理を統一するためのカスタムフック

import { useCallback } from 'react';
import { useUIStore, useChartDataStore, useChartConfigStore, useRealTimeStore } from '@/store';
import { selectActiveTab } from '@/store/ui/selectors';
import { selectCurrentPrice, selectPriceChangePercent } from '@/store/chart/selectors';
import { TabType } from '@/types/store';
import { Timeframe, ChartType } from '@/types/chart';
import { ExchangeType } from '@/types/api';

/**
 * ChartToolbarコンポーネントの状態管理を統一するためのカスタムフック
 * グローバルな状態はストアから直接取得し、ロジックをカプセル化します
 */
export function useChartToolbar() {
  // UIストアから状態を取得
  const activeTab = useUIStore(selectActiveTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  // チャートデータストアから状態とアクションを取得
  const currentSymbol = useChartDataStore((state) => state.currentSymbol);
  const currentTimeFrame = useChartDataStore((state) => state.currentTimeFrame);
  const updateTimeFrame = useChartDataStore((state) => state.updateTimeFrame);
  const updateSymbol = useChartDataStore((state) => state.updateSymbol);
  const fetchData = useChartDataStore((state) => state.fetchData);
  // メモ化されたセレクターを使用
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);
  const error = useChartDataStore((state) => state.error);

  // チャート設定ストアから状態とアクションを取得
  const chartType = useChartConfigStore((state) => state.chartType);
  const exchangeType = useChartConfigStore((state) => state.exchangeType);
  const setChartType = useChartConfigStore((state) => state.setChartType);
  const setExchangeType = useChartConfigStore((state) => state.setExchangeType);

  // リアルタイム更新ストアから状態とアクションを取得
  const useRealTimeData = useRealTimeStore((state) => state.useRealTimeData);
  const toggleRealTimeData = useRealTimeStore((state) => state.toggleRealTimeData);

  // タブ切り替えハンドラー
  const handleTabChange = useCallback((value: string) => {
    if (value === "chart" || value === "positions") {
      setActiveTab(value as TabType);
    }
  }, [setActiveTab]);

  // タイムフレーム変更ハンドラー
  const handleTimeframeChange = useCallback((timeframe: string) => {
    if (isValidTimeframe(timeframe)) {
      updateTimeFrame(timeframe as Timeframe);
    }
  }, [updateTimeFrame]);

  // シンボル変更ハンドラー
  const handleSymbolChange = useCallback((symbol: string) => {
    updateSymbol(symbol);
  }, [updateSymbol]);

  // チャートタイプ変更ハンドラー
  const handleChartTypeChange = useCallback((type: string) => {
    if (isValidChartType(type)) {
      setChartType(type as ChartType);
    }
  }, [setChartType]);

  // 取引種別変更ハンドラー
  const handleExchangeTypeChange = useCallback((type: ExchangeType) => {
    setExchangeType(type);
    fetchData(currentSymbol, currentTimeFrame);
  }, [setExchangeType, fetchData, currentSymbol, currentTimeFrame]);

  // 型安全性を確保するためのヘルパー関数
  const isValidTimeframe = (timeframe: string): timeframe is Timeframe => {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(timeframe);
  };

  // 型安全性を確保するためのヘルパー関数
  const isValidChartType = (type: string): type is ChartType => {
    return ['candles', 'line', 'bar', 'area'].includes(type);
  };

  return {
    // 状態
    activeTab,
    currentSymbol,
    currentTimeFrame,
    chartType,
    exchangeType,
    useRealTimeData,
    currentPrice,
    priceChangePercent,
    error,

    // アクション
    handleTabChange,
    handleTimeframeChange,
    handleSymbolChange,
    handleChartTypeChange,
    handleExchangeTypeChange,
    toggleRealTimeData,
  };
}