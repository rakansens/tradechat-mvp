// hooks/chart/useToolbarStores.ts
// 作成: チャートツールバーで必要なストアへのアクセスを一元管理するカスタムフック
// 役割:
// 1. 必要なすべてのストアのstateとactionをまとめて提供
// 2. コンポーネントとストアの結合度を下げる

import {
  // 分割されたチャートストア
  useChartConfigStore,
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore,
  useChartDataStore,
  // その他のストア
  useUIStore,
  useEntryStore,
  useSymbolStore
} from '@/store';
import { Timeframe, ChartType } from '@/types/chart';
import { IndicatorType, DrawingToolType } from '@/types/store';

/**
 * チャートツールバーで必要なすべてのストアの状態とアクションを提供するカスタムフック
 * @returns ツールバーUIに必要なすべてのストア状態とアクション
 */
export function useToolbarStores() {
  // SymbolStoreから状態とアクションを取得
  const currentSymbol = useSymbolStore(state => state.currentSymbol);
  const exchangeType = useSymbolStore(state => state.exchangeType);
  const setCurrentSymbol = useSymbolStore(state => state.setCurrentSymbol);
  const setExchangeType = useSymbolStore(state => state.setExchangeType);
  
  // ChartDataStoreから状態とアクションを取得
  const chartData = useChartDataStore(state => state.data);
  const error = useChartDataStore(state => state.error);
  const currentTimeFrame = useChartDataStore(state => state.currentTimeFrame);
  const updateTimeFrame = useChartDataStore(state => state.updateTimeFrame);
  const fetchChartData = useChartDataStore(state => state.fetchData);
  
  // ChartConfigStoreから状態とアクションを取得
  const chartType = useChartConfigStore(state => state.chartType);
  const setChartType = useChartConfigStore(state => state.setChartType);

  // IndicatorStoreから状態とアクションを取得
  const activeIndicators = useIndicatorStore(state => state.activeIndicators);
  const toggleIndicator = useIndicatorStore(state => state.toggleIndicator);
  const clearAllIndicators = useIndicatorStore(state => state.clearAllIndicators);
  const isIndicatorActive = useIndicatorStore(state => state.isIndicatorActive);

  // DrawingToolStoreから状態とアクションを取得
  const activeDrawingTools = useDrawingToolStore(state => state.activeDrawingTools);
  const toggleDrawingTool = useDrawingToolStore(state => state.toggleDrawingTool);
  const clearAllDrawingTools = useDrawingToolStore(state => state.clearAllDrawingTools);

  // RealTimeStoreから状態とアクションを取得
  const useRealTimeData = useRealTimeStore(state => state.useRealTimeData);
  const toggleRealTimeData = useRealTimeStore(state => state.toggleRealTimeData);
  
  // エントリーストアから状態を取得
  const entries = useEntryStore(state => state.entries);
  const openPositionsCount = entries.filter(entry => entry.status === "open").length;

  // シンボル変更を一元管理
  const handleSymbolChange = (symbol: string) => {
    setCurrentSymbol(symbol, 'ToolbarHook.handleSymbolChange');
  };

  return {
    // シンボル関連
    symbolStore: {
      currentSymbol,
      exchangeType,
      setCurrentSymbol,
      setExchangeType,
      handleSymbolChange
    },
    
    // チャートデータ関連
    chartDataStore: {
      chartData,
      error,
      currentTimeFrame,
      updateTimeFrame,
      fetchChartData
    },
    
    // チャート設定関連
    chartConfigStore: {
      chartType,
      setChartType
    },
    
    // インジケーター関連
    indicatorStore: {
      activeIndicators,
      toggleIndicator,
      clearAllIndicators,
      isIndicatorActive
    },
    
    // 描画ツール関連
    drawingToolStore: {
      activeDrawingTools,
      toggleDrawingTool,
      clearAllDrawingTools
    },
    
    // リアルタイム更新関連
    realTimeStore: {
      useRealTimeData,
      toggleRealTimeData
    },
    
    // エントリー関連
    entryStore: {
      entries,
      openPositionsCount
    }
  };
}

export default useToolbarStores; 