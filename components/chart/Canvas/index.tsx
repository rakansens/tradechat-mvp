/**
 * components/chart/Canvas/index.tsx
 * チャート描画用キャンバスコンポーネント
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 * - 2025-05-20: 古いストア参照を新しいRootStoreベースの実装に更新
 * - 2025-05-30: 廃止されたストアの参照を削除し、RootStoreのセレクターに完全に置き換え
 */

"use client"

import { useEffect } from "react"
import { OHLCData } from "@/types/chart"
import { ChartType, ExtendedChartType } from "@/types/constants/enums"
import { logger } from '@/utils/common'
import { useRootStore } from "@/store"
import { selectChartData, selectCurrentSymbol, selectCurrentTimeFrame } from "@/store/chart/data/selectors"
import { selectChartType } from "@/store/chart/config/selectors"
import { selectActiveIndicators } from "@/store/chart/indicator/selectors"
import { selectActiveDrawingTool } from "@/store/chart/drawingTool/selectors"
// 一時的なインターフェースを追加して型互換性を確保
interface IndicatorWithParams {
  type: string;
  params?: any;
}
import { CandlestickSeries, LineSeries, AreaSeries } from "lightweight-charts";

// リファクタリングした各Hookをインポート
import { useChartCore } from '../core/useChartCore'
import { useIndicators } from '../indicators/useIndicators'
import { useDrawingTools } from '../drawings/useDrawingTools'
import { useChartEvents } from '../events/useChartEvents'

/**
 * チャートキャンバスコンポーネント
 * 
 * 責務:
 * - DIVコンテナの提供とrefの管理
 * - 各種チャート関連Hookの統合
 * - データ更新時のチャート再描画
 */
export default function ChartCanvas() {
  // コアチャート機能を使用
  const { 
    chartRef, 
    chartInstanceRef, 
    seriesRefs, 
    updateChartData 
  } = useChartCore();
  
  // インジケーター管理を使用
  const { 
    updateIndicators 
  } = useIndicators();
  
  // 描画ツール管理を使用
  const { 
    updateDrawings 
  } = useDrawingTools();
  
  // イベント管理を使用
  useChartEvents();
  
  // ストアからデータを取得（RootStoreとセレクターを使用）
  const data = useRootStore(selectChartData);
  const currentSymbol = useRootStore(selectCurrentSymbol);
  const currentTimeFrame = useRootStore(selectCurrentTimeFrame);
  // 型の互換性を確保するために拡張型定義を使用
  const chartType = useRootStore(selectChartType as any) as ExtendedChartType;
  const activeIndicators = useRootStore(selectActiveIndicators);
  const activeDrawingTools = useRootStore(selectActiveDrawingTool);
  
  // チャートタイプが変更されたときにシリーズを切り替え
  useEffect(() => {
    const chartInstance = chartInstanceRef.current;
    if (!chartInstance) return;
    
    // シリーズの切り替え
    if (chartType === 'candles') {
      // 既存のシリーズを削除
      if (seriesRefs.lineSeries.current) {
        chartInstance.removeSeries(seriesRefs.lineSeries.current);
        seriesRefs.lineSeries.current = null;
      }
      if (seriesRefs.areaSeries.current) {
        chartInstance.removeSeries(seriesRefs.areaSeries.current);
        seriesRefs.areaSeries.current = null;
      }
      
      // ローソク足シリーズが存在しない場合は新規作成
      if (!seriesRefs.candleSeries.current) {
        seriesRefs.candleSeries.current = chartInstance.addSeries(CandlestickSeries, {
          upColor: "#26A69A",
          downColor: "#EF5350",
          borderVisible: false,
          wickUpColor: "#26A69A",
          wickDownColor: "#EF5350",
        });
      }
    } else if (chartType === 'line') {
      // 既存のシリーズを削除
      if (seriesRefs.candleSeries.current) {
        chartInstance.removeSeries(seriesRefs.candleSeries.current);
        seriesRefs.candleSeries.current = null;
      }
      if (seriesRefs.areaSeries.current) {
        chartInstance.removeSeries(seriesRefs.areaSeries.current);
        seriesRefs.areaSeries.current = null;
      }
      
      // ラインシリーズが存在しない場合は新規作成
      if (!seriesRefs.lineSeries.current) {
        seriesRefs.lineSeries.current = chartInstance.addSeries(LineSeries, {
          color: "#2962FF",
          lineWidth: 2,
        });
      }
    } else if (chartType === 'area') {
      // 既存のシリーズを削除
      if (seriesRefs.candleSeries.current) {
        chartInstance.removeSeries(seriesRefs.candleSeries.current);
        seriesRefs.candleSeries.current = null;
      }
      if (seriesRefs.lineSeries.current) {
        chartInstance.removeSeries(seriesRefs.lineSeries.current);
        seriesRefs.lineSeries.current = null;
      }
      
      // エリアシリーズが存在しない場合は新規作成
      if (!seriesRefs.areaSeries.current) {
        seriesRefs.areaSeries.current = chartInstance.addSeries(AreaSeries, {
          topColor: "rgba(41, 98, 255, 0.56)",
          bottomColor: "rgba(41, 98, 255, 0.04)",
          lineColor: "rgba(41, 98, 255, 1)",
          lineWidth: 2,
        });
      }
    }
    
    // データが存在する場合は更新
    if (data && data.length > 0) {
      updateChartData(data, chartType);
    }
    
    logger.info(`チャートタイプを変更しました: ${chartType}`, {
      component: 'ChartCanvas',
      action: 'changeChartType'
    });
  }, [chartType, chartInstanceRef, seriesRefs, updateChartData]);
  
  // データが更新されたらチャートを更新
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    // チャートデータを更新
    updateChartData(data, chartType);
    
    logger.debug('チャートデータを更新しました', {
      component: 'ChartCanvas',
      action: 'updateData',
      dataLength: data.length
    });
  }, [data, chartType, updateChartData, chartInstanceRef]);
  
  // インジケーターの状態が変化した場合に更新
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    // メインシリーズを取得
    const mainSeries = 
      seriesRefs.candleSeries.current || 
      seriesRefs.lineSeries.current || 
      seriesRefs.areaSeries.current;
    
    if (!mainSeries) return;
    
    // インジケーターを更新
    updateIndicators(chartInstanceRef.current, data);
    
    logger.debug('インジケーターを更新しました', {
      component: 'ChartCanvas',
      action: 'updateIndicators',
      activeIndicators: activeIndicators.map(i => (i as unknown as IndicatorWithParams).type || String(i))
    });
  }, [data, activeIndicators, chartInstanceRef, seriesRefs, updateIndicators]);
  
  // 描画ツールの状態が変化した場合に更新
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    // メインシリーズを取得
    const mainSeries = 
      seriesRefs.candleSeries.current || 
      seriesRefs.lineSeries.current || 
      seriesRefs.areaSeries.current;
    
    if (!mainSeries) return;
    
    // 描画ツールを更新
    updateDrawings(chartInstanceRef.current, mainSeries, data);
    
    logger.debug('描画ツールを更新しました', {
      component: 'ChartCanvas',
      action: 'updateDrawings',
      activeDrawingTools
    });
  }, [data, activeDrawingTools, chartInstanceRef, seriesRefs, updateDrawings]);

  return (
    <div
      ref={chartRef}
      className="w-full h-full bg-dark-800"
      style={{ height: "100%" }}
    />
  );
} 