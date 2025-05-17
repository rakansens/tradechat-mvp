/**
 * hooks/chart/toolbar/useToolbarStores.ts
 * チャートツールバーで必要なストアへのアクセスを一元管理するカスタムフック
 * 
 * 役割:
 * 1. 必要なすべてのストアのstateとactionをまとめて提供
 * 2. コンポーネントとストアの結合度を下げる
 * 
 * 変更履歴:
 * - 作成: ChartToolbar.tsxのリファクタリングに伴い作成
 * - 更新: 古いストア（useChartDataStore、useChartConfigStore、useUIStore）をuseRootStoreに置き換え
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: 2025-05-15 - useEntryStoreをuseRootStoreに置き換え
 * - 更新: 2025-05-15 - useIndicatorStore, useDrawingToolStore, useRealTimeStoreNewをuseRootStoreに置き換え
 * - 更新: 2025-06-05 - selectSymbolCurrentSymbol/selectSymbolExchangeTypeをselectCurrentSymbol/selectExchangeTypeに変更
 * - 更新: 2025-06-15: chart/toolbar/ サブディレクトリに移動
 */

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
  selectExchangeType
} from '@/store/barrel';
// インジケーター関連のセレクターをインポート
import {
  selectActiveIndicators
} from '@/store/chart/indicator/selectors';
// 描画ツール関連のセレクターをインポート
import { logger } from '@/utils/common';

// IndicatorTypeが文字列ユニオン型に変わったので一時的な互換インターフェースを追加
interface IndicatorWithParams {
  type: string;
  params?: any;
}

import {
  selectActiveDrawingTool
} from '@/store/chart/drawingTool/selectors';
// リアルタイム更新関連のセレクターをインポート
import {
  selectUseRealTimeData
} from '@/store/chart/realTime/selectors';
import { Timeframe, ChartType, ActiveIndicator } from '@/types/constants/enums';
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
  // 型不一致を解決するためにセレクターをキャスト
  const exchangeType = useRootStore(selectExchangeType as any);
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const setExchangeType = useRootStore(state => state.setExchangeType);
  
  // ChartDataSliceから状態とアクションを取得（RootStoreを使用）
  const chartData = useRootStore(selectChartData);
  const error = useRootStore(selectError);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  const updateTimeFrame = useRootStore((state) => state.updateTimeFrame);
  const fetchChartData = useRootStore((state) => state.fetchData);
  
  // ChartConfigSliceから状態とアクションを取得（RootStoreを使用）
  // 型不一致を解決するためにセレクターをキャスト
  const chartType = useRootStore(selectChartType as any);
  const setChartType = useRootStore((state) => state.setChartType);

  // IndicatorStoreから状態とアクションを取得（RootStoreを使用）
  const activeIndicators = useRootStore(selectActiveIndicators);
  const toggleIndicator = useRootStore(state => state.toggleIndicator);
  
  // chart.indicatorスライスにclearAllIndicatorsを移動したため、カスタム実装を使用
  // 必要な場合はインジケーターを個別にトグルする代替実装を用意
  const clearAllIndicators = useRootStore(state => {
    // ストア構造変更に対応: chartスライスの下に移動した可能性を確認
    // RootStoreの型定義と実際の実装に不一致があるため型アサーションを使用
    const anyState = state as any;
    if (anyState.chart?.indicator?.clearAllIndicators) {
      return anyState.chart.indicator.clearAllIndicators;
    }
    
    // 代替実装: アクティブな各インジケーターをトグルしてオフにする
    return () => {
      if (activeIndicators.length > 0) {
        // 各インジケーターを要素ごとにトグル
        Array.from(new Set(activeIndicators.map(i => (i as unknown as IndicatorWithParams).type)))
          .forEach(type => {
            if (toggleIndicator) toggleIndicator(type as any);
          });
        logger.info('所属するスライスが見つからないため、代替実装で全インジケーターをクリアしました', {
          component: 'useToolbarStores',
          action: 'clearAllIndicators'
        });
      }
    };
  });
  // isIndicatorActive関数を直接ストアから取得せず、自前で実装
  const isIndicatorActive = (indicator: IndicatorType) => {
    return activeIndicators.some(item => (item as unknown as IndicatorWithParams).type === indicator);
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