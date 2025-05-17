/**
 * hooks/chart/canvas/useChartStores.ts
 * チャート関連の複数のストアを一元管理するフック
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 * - 2023-07-10: 新しいrootStoreからのチャートデータを追加
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: 2025-06-05 - selectSymbolCurrentSymbol/selectSymbolExchangeTypeをselectCurrentSymbol/selectExchangeTypeに変更
 * - 更新: 2025-06-15: chart/canvas/ サブディレクトリに移動
 * - 更新: 2025-06-30: 型インポートパスを修正
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
import type { IndicatorType } from '@/types/store/chart';
import type { DrawingToolType } from '@/types/store/chart';

/**
 * チャート関連のストアを一元管理するフック
 * rootStoreからチャートデータとタイプを取得するように実装
 * 
 * 変更履歴:
 * - 2025-05-17: リファクタリング中の注釈追加
 */
export const useChartStores = () => {
  // シンボルストアからデータ取得（rootStoreのSymbolSliceから）
  // リファクタリング中の型エラーを回避するために型アサーションを使用
  const currentSymbol = useRootStore(selectCurrentSymbol as any);
  const exchangeType = useRootStore(selectExchangeType as any);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  
  // 取引種別を設定するメソッド
  const setProductType = useRootStore(state => state.setProductType);
  
  // rootStoreから直接取得 (型不一致を回避するために型アサーションを使用)
  const timeframe = useRootStore(selectTimeframe as any);
  const chartType = useRootStore(selectChartType as any);
  const ohlcData = useRootStore(selectOHLCData);
  
  // rootStoreのアクションを取得
  const setTimeframe = useRootStore(state => state.setTimeframe);
  const setChartType = useRootStore(state => state.setChartType);
  const refreshOhlcData = useRootStore(state => state.refreshOhlcData);
  
  // モックデータとダミー関数（実際のアプリケーションでは実装が必要）
  const activeIndicators: IndicatorType[] = [];
  const activeDrawingTool: DrawingToolType | null = null;
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
    setProductType,
    
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
    activeDrawingTool,
    toggleDrawingTool,
    clearAllDrawingTools,
    
    // リアルタイム関連
    useRealTimeData,
    toggleRealTimeData,
    stopRealTimeUpdates,
    initializeApi
  };
}; 