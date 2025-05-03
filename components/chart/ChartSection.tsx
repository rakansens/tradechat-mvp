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
import { 
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore
} from "@/store"
import { theme } from "@/styles/colors"
import ChartToolbar from "./ChartToolbar"

// 共通インターフェースを組み合わせて使用
interface ChartSectionProps extends ChartViewProps, Pick<TimeframeControlProps, 'timeframe'> {
  // 追加のプロパティがあればここに定義
}

export default function ChartSection() {
  // チャートデータ関連の状態とアクション
  const { 
    currentSymbol, 
    currentTimeFrame,
    updateTimeFrame, 
    updateSymbol,
    fetchData
  } = useChartDataStore();
  
  // チャート設定関連の状態とアクション
  const { 
    chartType,
    setChartType 
  } = useChartConfigStore();
  
  // リアルタイム更新関連のアクション
  const {
    stopRealTimeUpdates
  } = useRealTimeStore();

  // コンポーネントのマウント時にチャートを初期化
  useEffect(() => {
    // 新しいストアを使用
    fetchData(currentSymbol, currentTimeFrame);
    
    // コンポーネントのアンマウント時にWebSocketを切断
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  const handleTimeframeChange = (timeframe: string) => {
    // 型安全な実装に変更
    if (isValidTimeframe(timeframe)) {
      updateTimeFrame(timeframe);
    }
  };
  
  // 型安全性を確保するためのヘルパー関数
  const isValidTimeframe = (timeframe: string): timeframe is Timeframe => {
    return ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(timeframe);
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
