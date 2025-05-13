/**
 * hooks/chart/useChartStores.ts
 * チャート関連の複数のストアを一元管理するフック
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 * - 2023-07-10: 新しいrootStoreからのチャートデータを追加
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: 2025-06-05 - selectSymbolCurrentSymbol/selectSymbolExchangeTypeをselectCurrentSymbol/selectExchangeTypeに変更
 */

// 古いインポートを削除
// import { useSymbolStore } from '@/store/useSymbolStore';
// 既存のフックをインポート
import { useRootStore } from '@/store/rootStore';
import { 
  selectTimeframe, 
  selectChartType, 
  selectOHLCData,
  selectCurrentSymbol,
  selectExchangeType
} from '@/store/barrel';
import type { IndicatorType, DrawingToolType } from '@/types/store';

/**
 * チャート関連のストアを一元管理するフック
 * rootStoreからチャートデータとタイプを取得するように実装
 */
export const useChartStores = () => {
  // シンボルストアからデータ取得（rootStoreのSymbolSliceから）
  const currentSymbol = useRootStore(selectCurrentSymbol);
  const exchangeType = useRootStore(selectExchangeType);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const setExchangeType = useRootStore(state => state.setExchangeType);
  
  // rootStoreから直接取得
  const timeframe = useRootStore(selectTimeframe);
  const chartType = useRootStore(selectChartType);
  const ohlcData = useRootStore(selectOHLCData);
  
  // rootStoreのアクションを取得
  const setTimeframe = useRootStore(state => state.setTimeframe);
  const setChartType = useRootStore(state => state.setChartType);
  const refreshOhlcData = useRootStore(state => state.refreshOhlcData);
  
  // モックデータとダミー関数（実際のアプリケーションでは実装が必要）
  const activeIndicators: IndicatorType[] = [];
  const activeDrawingTools: DrawingToolType[] = [];
  const toggleIndicator = (indicator: IndicatorType) => {};
  const toggleDrawingTool = (tool: DrawingToolType) => {};
  const clearAllIndicators = () => {};
  const clearAllDrawingTools = () => {};
  const useRealTimeData = false;
  const toggleRealTimeData = () => {};
  const stopRealTimeUpdates = () => {};
  const initializeApi = () => {};
  
  return {
    // シンボル関連
    currentSymbol,
    exchangeType,
    setCurrentSymbol,
    setExchangeType,
    
    // チャートデータ関連
    chartData: ohlcData,
    currentTimeFrame: timeframe,
    isLoading: false,
    error: null,
    updateTimeFrame: setTimeframe,
    fetchData: (symbol: string, timeframe: string) => {
      refreshOhlcData();
    },
    
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