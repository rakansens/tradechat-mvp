/**
 * hooks/chart/useChartStores.ts
 * チャート関連の複数のストアを一元管理するフック
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 */

import { useSymbolStore } from '@/store/useSymbolStore';
import { 
  useChartDataStore,
  useChartConfigStore,
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore
} from '@/store/chart';

/**
 * チャート関連の6つのストアを一元管理するフック
 * 
 * 返り値:
 * - SymbolStore: 銘柄と取引種別
 * - ChartDataStore: チャートデータとタイムフレーム
 * - ChartConfigStore: チャートタイプ
 * - IndicatorStore: インジケーター
 * - DrawingToolStore: 描画ツール
 * - RealTimeStore: リアルタイムデータ
 */
export const useChartStores = () => {
  // シンボルストアからデータ取得
  const currentSymbol = useSymbolStore(s => s.currentSymbol);
  const exchangeType = useSymbolStore(s => s.exchangeType);
  const setCurrentSymbol = useSymbolStore(s => s.setCurrentSymbol);
  const setExchangeType = useSymbolStore(s => s.setExchangeType);
  
  // チャートデータストアから取得
  const { 
    data: chartData,
    currentTimeFrame,
    isLoading,
    error,
    updateTimeFrame,
    fetchData
  } = useChartDataStore();
  
  // チャート設定ストアから取得
  const {
    chartType,
    setChartType
  } = useChartConfigStore();
  
  // インジケーターストアから取得 
  const {
    activeIndicators,
    toggleIndicator,
    clearAllIndicators
  } = useIndicatorStore();
  
  // 描画ツールストアから取得
  const {
    activeDrawingTools,
    toggleDrawingTool, 
    clearAllDrawingTools
  } = useDrawingToolStore();
  
  // リアルタイムストアから取得
  const {
    useRealTimeData,
    toggleRealTimeData,
    stopRealTimeUpdates,
    initializeApi
  } = useRealTimeStore();
  
  return {
    // シンボル関連
    currentSymbol,
    exchangeType,
    setCurrentSymbol,
    setExchangeType,
    
    // チャートデータ関連
    chartData,
    currentTimeFrame,
    isLoading,
    error,
    updateTimeFrame,
    fetchData,
    
    // チャート設定関連
    chartType,
    setChartType,
    
    // インジケーター関連
    activeIndicators,
    toggleIndicator,
    clearAllIndicators,
    
    // 描画ツール関連
    activeDrawingTools,
    toggleDrawingTool,
    clearAllDrawingTools,
    
    // リアルタイム関連
    useRealTimeData,
    toggleRealTimeData,
    stopRealTimeUpdates,
    initializeApi
  };
}; 