/**
 * hooks/chart/toolbar/useChartToolbar.ts
 * 
 * ChartToolbarコンポーネントの状態管理を統一するためのカスタムフック
 * グローバルな状態はストアから直接取得し、ロジックをカプセル化
 *
 * 変更履歴:
 * - 2023-06-15: 初期実装
 * - 2023-08-10: useChartDataStoreをuseRootStoreに置き換え
 * - 2023-09-05: useUIStoreをuseRootStoreに置き換え、UIセレクターを使用するように修正
 * - 2023-10-20: useChartConfigStoreをuseRootStoreに置き換え、ChartConfigセレクターを使用するように修正
 * - 2025-05-15: フックのリファクタリングに伴いhooks/chart/toolbarディレクトリに移動
 * - 2025-10-12: S-12フェーズ - インポートパスを修正
 */

import { useCallback } from 'react';
import { useRootStore } from '@/store';
import { selectActiveTab } from '@/store/ui/selectors';
import { 
  selectCurrentPrice,
  selectCurrentSymbol, 
  selectCurrentTimeFrame, 
  selectError 
} from '@/store/chart/data/selectors';
import { selectPriceChangePercent } from '@/store/chart/selectors';
import { selectChartType, selectExchangeType } from '@/store/chart/config/selectors';
import { TabType } from '@/types/store/ui';
import { Timeframe, ChartType } from '@/types/chart';
import { ExchangeType } from '@/types/api';

/**
 * ChartToolbarコンポーネントの状態管理を統一するためのカスタムフック
 * グローバルな状態はストアから直接取得し、ロジックをカプセル化します
 */
export function useChartToolbar() {
  // UIストアから状態を取得（RootStoreから取得するように変更）
  const activeTab = useRootStore(selectActiveTab);
  const setActiveTab = useRootStore((state) => state.setActiveTab);

  // RootStoreからチャートデータ関連の状態とアクションを取得
  const currentSymbol = useRootStore(selectCurrentSymbol);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const updateTimeFrame = useRootStore((state) => state.updateTimeFrame);
  const updateSymbol = useRootStore((state) => state.updateSymbol);
  const fetchData = useRootStore((state) => state.fetchData);
  // メモ化されたセレクターを使用
  const currentPrice = useRootStore(selectCurrentPrice);
  const priceChangePercent = useRootStore(selectPriceChangePercent);
  const error = useRootStore(selectError);

  // チャート設定ストアから状態とアクションを取得（RootStoreから取得するように変更）
  const chartType = useRootStore(selectChartType);
  const exchangeType = useRootStore(selectExchangeType);
  const setChartType = useRootStore((state) => state.setChartType);
  const setExchangeType = useRootStore((state) => state.setExchangeType);

  // リアルタイム更新の状態とアクションをrootStoreから取得
  const useRealTimeData = useRootStore((state) => state.useRealTimeData);
  const toggleRealTimeData = useRootStore((state) => state.toggleRealTimeData);

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