/**
 * hooks/chart/useChartSectionStores.ts
 * チャートセクション用のストアセレクターとアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 */

import { useMemo } from 'react';
import { 
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore
} from '@/store/chart';
import { useSymbolStore } from '@/store/useSymbolStore';
import type { Timeframe, ChartType } from '@/types/chart';
import { formatTimestamp } from '@/utils/chartUtils';

/**
 * チャートセクションで使用される4つのストアからのデータとアクションを集約するフック
 * 
 * 返り値:
 * - symbolStore: シンボル関連のデータとアクション
 * - chartDataStore: チャートデータ関連の状態とアクション
 * - configStore: チャート設定関連の状態とアクション
 * - realTimeStore: リアルタイムデータ関連のアクション
 * - derivedData: データから計算された派生値
 */
export const useChartSectionStores = () => {
  // SymbolStore
  const currentSymbol = useSymbolStore(state => state.currentSymbol);
  const exchangeType = useSymbolStore(state => state.exchangeType);
  const setCurrentSymbol = useSymbolStore(state => state.setCurrentSymbol);
  const setExchangeType = useSymbolStore(state => state.setExchangeType);
  
  // ChartDataStore
  const chartData = useChartDataStore(state => state.data);
  const currentTimeFrame = useChartDataStore(state => state.currentTimeFrame);
  const isLoading = useChartDataStore(state => state.isLoading);
  const error = useChartDataStore(state => state.error);
  const updateTimeFrame = useChartDataStore(state => state.updateTimeFrame);
  const fetchChartData = useChartDataStore(state => state.fetchData);
  
  // ChartConfigStore
  const chartType = useChartConfigStore(state => state.chartType);
  const setChartType = useChartConfigStore(state => state.setChartType);
  
  // RealTimeStore
  const stopRealTimeUpdates = useRealTimeStore(state => state.stopRealTimeUpdates);
  const initializeApi = useRealTimeStore(state => state.initializeApi);
  
  // 派生データの計算
  const derivedData = useMemo(() => {
    // 最新価格の計算
    const currentPrice = chartData && chartData.length > 0
      ? chartData[chartData.length - 1].close
      : 0;
    
    // 価格変化率の計算
    const priceChangePercent = chartData && chartData.length >= 2
      ? ((chartData[chartData.length - 1].close - chartData[0].open) / chartData[0].open) * 100
      : 0;
    
    // 日付範囲の計算
    const dateRange = chartData && chartData.length >= 2
      ? [chartData[0].time, chartData[chartData.length - 1].time] as [number, number]
      : null;
    
    // フォーマット済み日付範囲
    const formattedDateRange = dateRange
      ? `${formatTimestamp(dateRange[0])} - ${formatTimestamp(dateRange[1])}`
      : '';
    
    return {
      currentPrice,
      priceChangePercent,
      dateRange,
      formattedDateRange
    };
  }, [chartData]);

  // 型安全性のためのヘルパー関数
  const isValidTimeframe = (timeframe: string): timeframe is Timeframe => {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(timeframe);
  };

  const isValidChartType = (type: string): type is ChartType => {
    return ['candles', 'line', 'bar', 'area'].includes(type);
  };

  // ハンドラー関数
  const handleTimeframeChange = (timeframe: string) => {
    if (isValidTimeframe(timeframe)) {
      updateTimeFrame(timeframe);
    }
  };

  const handleChartTypeChange = (type: string) => {
    if (isValidChartType(type)) {
      setChartType(type);
    }
  };

  const handleSymbolChange = (symbol: string) => {
    setCurrentSymbol(symbol);
  };

  return {
    // 各ストアからのデータとアクション
    symbolStore: {
      currentSymbol,
      exchangeType,
      setCurrentSymbol,
      setExchangeType
    },
    chartDataStore: {
      chartData,
      currentTimeFrame,
      isLoading,
      error,
      updateTimeFrame,
      fetchChartData
    },
    configStore: {
      chartType,
      setChartType
    },
    realTimeStore: {
      stopRealTimeUpdates,
      initializeApi
    },
    
    // 派生データ
    derivedData,
    
    // ハンドラー関数
    handlers: {
      handleTimeframeChange,
      handleChartTypeChange,
      handleSymbolChange
    }
  };
}; 