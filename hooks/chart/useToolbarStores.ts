// hooks/chart/useToolbarStores.ts
// @deprecated hooks/chart/toolbar/useToolbarStores.ts に移動しました
//
// 作成: チャートツールバーで必要なストアへのアクセスを一元管理するカスタムフック
// 役割:
// 1. 必要なすべてのストアのstateとactionをまとめて提供
// 2. コンポーネントとストアの結合度を下げる
// 更新: 古いストア（useChartDataStore、useChartConfigStore、useUIStore）をuseRootStoreに置き換え
// 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
// 更新: 2025-05-15 - useEntryStoreをuseRootStoreに置き換え
// 更新: 2025-05-15 - useIndicatorStore, useDrawingToolStore, useRealTimeStoreNewをuseRootStoreに置き換え
// 更新: 2025-06-05 - selectSymbolCurrentSymbol/selectSymbolExchangeTypeをselectCurrentSymbol/selectExchangeTypeに変更
// 更新: 2025-10-12 - S-12フェーズ - 型のインポートパスを修正

import {
  // ルートストアとセレクター
  useRootStore,
  // セレクター
  selectEntries
} from '@/store';
// 各スライスのセレクターをインポート
import { 
  selectChartType
  // selectExchangeTypeは削除し、barrelから統一してインポート
} from '@/store/chart/config/selectors';
import {
  selectChartData,
  selectError,
  selectCurrentTimeFrame
} from '@/store/chart/data/selectors';
import { selectActiveTab } from '@/store/ui/selectors';
// シンボル関連のセレクターをインポート
import {
  selectCurrentSymbol,
  selectProductType
} from '@/store/barrel';
// インジケーター関連のセレクターをインポート
import {
  selectActiveIndicators,
  selectIsIndicatorActive
} from '@/store/chart/indicator/selectors';
// 描画ツール関連のセレクターをインポート
import {
  selectActiveDrawingTool
} from '@/store/chart/drawingTool/selectors';
// リアルタイム更新関連のセレクターをインポート
import {
  selectUseRealTimeData
} from '@/store/chart/realTime/selectors';
import { Timeframe, ChartType } from '@/types/chart';
import { IndicatorType, DrawingToolType } from '@/types/store/chart';
import { EntrySliceState } from '@/store/entry/state';
// 古いSymbolStateの型インポートを削除
// import type { SymbolState } from '@/store/useSymbolStore';

/**
 * チャートツールバーで必要なすべてのストアの状態とアクションを提供するカスタムフック
 * @returns ツールバーUIに必要なすべてのストア状態とアクション
 */
export function useToolbarStores() {
  // SymbolStoreからSymbolSliceに移行
  const currentSymbol = useRootStore(selectCurrentSymbol);
  const exchangeType = useRootStore(selectProductType);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const setExchangeType = useRootStore(state => state.setProductType ?? state.setExchangeType);
  
  // ChartDataSliceから状態とアクションを取得（RootStoreを使用）
  const chartData = useRootStore(selectChartData);
  const error = useRootStore(selectError);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const updateTimeFrame = useRootStore((state) => state.updateTimeFrame);
  const fetchChartData = useRootStore((state) => state.fetchData);
  
  // ChartConfigSliceから状態とアクションを取得（RootStoreを使用）
  const chartType = useRootStore(selectChartType);
  const setChartType = useRootStore((state) => state.setChartType);

  // IndicatorStoreから状態とアクションを取得（RootStoreを使用）
  const activeIndicators = useRootStore(selectActiveIndicators);
  const toggleIndicator = useRootStore(state => state.toggleIndicator);
  // clearAllIndicatorsアクションがないため、自前で実装
  const clearAllIndicators = () => {
    // すべてのアクティブなインジケーターを無効化
    activeIndicators.forEach(indicator => {
      toggleIndicator(indicator);
    });
  };
  
  // isIndicatorActive関数を実装
  const isIndicatorActive = (indicator: IndicatorType) => {
    return activeIndicators.includes(indicator);
  };

  // DrawingToolStoreから状態とアクションを取得（RootStoreを使用）
  const activeDrawingTools = useRootStore(selectActiveDrawingTool);
  const toggleDrawingTool = useRootStore(state => state.toggleDrawingTool);
  const clearAllDrawingTools = useRootStore(state => state.clearAllDrawingTools);

  // RealTimeStoreから状態とアクションを取得（RootStoreを使用）
  const useRealTimeData = useRootStore(selectUseRealTimeData);
  const toggleRealTimeData = useRootStore(state => state.toggleRealTimeData);
  
  // エントリーストアから状態を取得（RootStoreとセレクターを使用）
  const entries = useRootStore(selectEntries);
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