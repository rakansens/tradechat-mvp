// hooks/chart/useToolbarStores.ts
// 作成: チャートツールバーで必要なストアへのアクセスを一元管理するカスタムフック
// 役割:
// 1. 必要なすべてのストアのstateとactionをまとめて提供
// 2. コンポーネントとストアの結合度を下げる
// 更新: 古いストア（useChartDataStore、useChartConfigStore、useUIStore）をuseRootStoreに置き換え
// 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え

import {
  // ルートストアとセレクター
  useRootStore,
  // 分割されたチャートストア
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStoreNew,
  // 古いストア（まだマイグレーションされていないもの）
  useEntryStore,
  // 古いSymbolStoreは削除
  // useSymbolStore
} from '@/store';
// 各スライスのセレクターをインポート
import { 
  selectChartType,
  selectExchangeType 
} from '@/store/chart/config/selectors';
import {
  selectChartData,
  selectError,
  selectCurrentTimeFrame
} from '@/store/chart/data/selectors';
import { selectActiveTab } from '@/store/ui/selectors';
import { 
  selectSymbolCurrentSymbol,
  selectSymbolExchangeType
} from '@/store/barrel';
import { Timeframe, ChartType } from '@/types/chart';
import { IndicatorType, DrawingToolType } from '@/types/store';
import { EntrySliceState } from '@/store/entry/state';
// 古いSymbolStateの型インポートを削除
// import type { SymbolState } from '@/store/useSymbolStore';

/**
 * チャートツールバーで必要なすべてのストアの状態とアクションを提供するカスタムフック
 * @returns ツールバーUIに必要なすべてのストア状態とアクション
 */
export function useToolbarStores() {
  // SymbolStoreからSymbolSliceに移行
  const currentSymbol = useRootStore(selectSymbolCurrentSymbol);
  const exchangeType = useRootStore(selectSymbolExchangeType);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const setExchangeType = useRootStore(state => state.setExchangeType);
  
  // ChartDataSliceから状態とアクションを取得（RootStoreを使用）
  const chartData = useRootStore(selectChartData);
  const error = useRootStore(selectError);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const updateTimeFrame = useRootStore((state) => state.updateTimeFrame);
  const fetchChartData = useRootStore((state) => state.fetchData);
  
  // ChartConfigSliceから状態とアクションを取得（RootStoreを使用）
  const chartType = useRootStore(selectChartType);
  const setChartType = useRootStore((state) => state.setChartType);

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
  const useRealTimeData = useRealTimeStoreNew(state => state.useRealTimeData);
  const toggleRealTimeData = useRealTimeStoreNew(state => state.toggleRealTimeData);
  
  // エントリーストアから状態を取得
  const entries = useEntryStore((state: EntrySliceState) => state.entries);
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