// components/chart/ChartSection.tsx
// 更新: 共通インターフェースを使用するように修正
"use client"

import React, { useEffect } from "react";
import { getTimeframeDisplayName } from "@/utils/ohlcDummyData"
import ChartCanvas from "@/components/chart/ChartCanvas"
import type { Entry } from "@/types/entry"
import type { Timeframe, ChartType } from "@/types/chart"
import type { ChartViewProps, TimeframeControlProps, ChartTypeControlProps } from "@/types/common-interfaces"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, CandlestickChart, LineChart } from "lucide-react"
import { useChartStore } from "@/store"
import { theme } from "@/styles/colors"
import ChartToolbar from "./ChartToolbar"

// 共通インターフェースを組み合わせて使用
interface ChartSectionProps extends ChartViewProps, Pick<TimeframeControlProps, 'timeframe'> {
  // 追加のプロパティがあればここに定義
}

export default function ChartSection() {
  const { 
    currentSymbol, 
    currentTimeFrame, 
    chartType, 
    initializeChart, 
    updateTimeFrame, 
    updateSymbol, 
    setChartType 
  } = useChartStore();

  // コンポーネントのマウント時にチャートを初期化
  useEffect(() => {
    initializeChart(currentSymbol, currentTimeFrame);
    
    // コンポーネントのアンマウント時にWebSocketを切断
    return () => {
      useChartStore.getState().stopRealTimeUpdates();
    };
  }, []);

  const handleTimeframeChange = (timeframe: string) => {
    updateTimeFrame(timeframe as any);
  };

  const handleSymbolChange = (symbol: string) => {
    updateSymbol(symbol);
  };

  const handleChartTypeChange = (type: string) => {
    setChartType(type as any);
  };

  return (
    <div className="relative flex flex-col w-full h-full">
      <ChartToolbar 
        timeframe={currentTimeFrame}
        onTimeframeChange={handleTimeframeChange}
        symbol={currentSymbol}
        onSymbolChange={handleSymbolChange}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
      />
      <div className="relative flex-grow">
        <ChartCanvas />
      </div>
    </div>
  );
}
