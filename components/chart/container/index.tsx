/**
 * components/chart/container/index.tsx
 * チャートコンテナコンポーネント
 * 
 * チャートの表示、インジケータ、描画ツール、設定などをラップする
 * 
 * 変更履歴:
 * - 2023-05-30: 初期実装
 * - 2023-06-01: サブコンポーネントに分割
 * - 2025-06-05: T-7.5フェーズ - 型インポートパスを修正
 */

"use client";

import React, { useCallback } from 'react';
import { ChartHeader } from './ChartHeader';
import { ChartBody } from './ChartBody';
import { ChartFooter } from './ChartFooter';
import { useChartGlobalEvents, useRealTimeCleanup } from '@/hooks/chart';
import { useChartStores } from '@/hooks/chart';
import type { Timeframe, ChartType } from '@/types/chart';
import type { ExchangeType } from '@/types/api';
import type { IndicatorType, DrawingToolType } from '@/types/store/chart';

/**
 * リファクタリングされたチャートコンテナ
 * 
 * サブコンポーネントに分割され、各機能が明確に分離されたチャートコンテナです。
 * ヘッダー、ボディ、フッターの3つの主要セクションから構成されています。
 */
export default function ChartContainer() {
  // すべてのストアから必要なデータとアクションを取得
  const {
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
    toggleRealTimeData
  } = useChartStores();
  
  // コンポーネントアンマウント時にリアルタイム更新を停止
  useRealTimeCleanup();
  
  // グローバルイベントをリッスン
  useChartGlobalEvents({
    currentSymbol,
    exchangeType,
    setCurrentSymbol,
    setExchangeType,
    currentTimeFrame,
    fetchData
  });
  
  // ハンドラー関数
  const handleTimeFrameChange = useCallback((newTimeFrame: Timeframe) => {
    updateTimeFrame(newTimeFrame);
  }, [updateTimeFrame]);
  
  const handleSymbolChange = useCallback((newSymbol: string) => {
    setCurrentSymbol(newSymbol);
  }, [setCurrentSymbol]);
  
  const handleExchangeTypeChange = useCallback((newType: ExchangeType) => {
    setExchangeType(newType);
  }, [setExchangeType]);
  
  const handleChartTypeChange = useCallback((newType: ChartType) => {
    setChartType(newType);
  }, [setChartType]);
  
  const handleToggleIndicator = useCallback((indicator: IndicatorType) => {
    toggleIndicator(indicator);
  }, [toggleIndicator]);
  
  const handleToggleDrawingTool = useCallback((tool: DrawingToolType) => {
    toggleDrawingTool(tool);
  }, [toggleDrawingTool]);
  
  const handleToggleRealTimeData = useCallback(() => {
    toggleRealTimeData();
  }, [toggleRealTimeData]);
  
  // ローディング中の表示
  if (isLoading) {
    return <div className="chart-loading">Loading chart data...</div>;
  }
  
  // エラー時の表示
  if (error) {
    return (
      <div className="chart-error">
        <h3>Error loading chart</h3>
        <p>{error}</p>
        <button onClick={() => fetchData(currentSymbol, currentTimeFrame)}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="chart-container">
      <ChartHeader
        currentSymbol={currentSymbol}
        currentTimeFrame={currentTimeFrame}
        chartType={chartType}
        exchangeType={exchangeType}
        useRealTimeData={useRealTimeData}
        handleTimeFrameChange={handleTimeFrameChange}
        handleChartTypeChange={handleChartTypeChange}
        handleExchangeTypeChange={handleExchangeTypeChange}
        handleToggleRealTimeData={handleToggleRealTimeData}
      />
      
      <ChartBody
        currentSymbol={currentSymbol}
        currentTimeFrame={currentTimeFrame}
        chartType={chartType}
        exchangeType={exchangeType}
        chartData={chartData}
        activeIndicators={activeIndicators}
        activeDrawingTools={activeDrawingTools}
      />
      
      <ChartFooter
        activeIndicators={activeIndicators}
        activeDrawingTools={activeDrawingTools}
        handleToggleIndicator={handleToggleIndicator}
        handleToggleDrawingTool={handleToggleDrawingTool}
        clearAllIndicators={clearAllIndicators}
        clearAllDrawingTools={clearAllDrawingTools}
      />
    </div>
  );
} 