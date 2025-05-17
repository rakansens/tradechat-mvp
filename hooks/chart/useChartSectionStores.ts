/**
 * hooks/chart/useChartSectionStores.ts
 * @deprecated hooks/chart/canvas/useChartSectionStores.ts に移動しました
 * 
 * チャートセクション用のストアセレクターとアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: 古いストア参照をuseRootStoreとセレクターに置き換え
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: 2025-06-05 - selectSymbolCurrentSymbol/selectSymbolExchangeTypeをselectCurrentSymbol/selectExchangeTypeに変更
 */

import { useMemo } from 'react';
import { 
  useRootStore,
  // 古いSymbolStoreは削除
  // useSymbolStore
} from '@/store';

// セレクターをインポート
import { 
  selectChartData, 
  selectCurrentTimeFrame, 
  selectIsLoading, 
  selectError 
} from '@/store/chart/data/selectors';
import { selectChartType } from '@/store/chart/config/selectors';
import {
  selectCurrentSymbol,
  selectProductType
} from '@/store/barrel';

import type { Timeframe, ChartType } from '@/types/chart';
import { formatTimestamp } from '@/utils/chart/chartUtils';

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
  // SymbolSliceをrootStoreから取得
  const currentSymbol = useRootStore(selectCurrentSymbol);
  const exchangeType = useRootStore(selectProductType);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const setExchangeType = useRootStore(state => state.setProductType ?? state.setExchangeType);
  
  // ChartDataStore (RootStoreから取得)
  const chartData = useRootStore(selectChartData);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const isLoading = useRootStore(selectIsLoading);
  const error = useRootStore(selectError);
  
  // ChartConfigStore (RootStoreから取得)
  const chartType = useRootStore(selectChartType);
  
  // RootStoreからアクションを取得
  const rootStore = useRootStore();
  const updateTimeFrame = rootStore.updateTimeFrame;
  const fetchChartData = rootStore.fetchData;
  const setChartType = rootStore.setChartType;
  const stopRealTimeUpdates = rootStore.stopRealTimeUpdates;
  const initializeApi = rootStore.initializeApi;
  
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
    return ['candles', 'line', 'bars', 'area'].includes(type);
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
    setCurrentSymbol(symbol, 'ChartSectionStores.handleSymbolChange');
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