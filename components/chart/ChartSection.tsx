// components/chart/ChartSection.tsx
// 更新: セレクタパターンを一貫して適用するように修正
"use client"

import React, { useEffect, useState } from "react";
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
  // チャートストア
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  selectDateRange,
  selectChartCurrentSymbol,
  selectCurrentTimeFrame,
  selectIsLoading,
  selectError,
  selectChartType,
  selectUpdateTimeFrame,
  selectUpdateSymbol,
  selectFetchData,
  selectSetChartType,
  selectStopRealTimeUpdates
} from "@/store"
import { theme } from "@/styles/colors"
import ChartToolbar from "./ChartToolbar"
import { formatTimestamp, ensureMilliseconds } from "@/utils/chartUtils"

// 共通インターフェースを組み合わせて使用
interface ChartSectionProps extends ChartViewProps, Pick<TimeframeControlProps, 'timeframe'> {
  // 追加のプロパティがあればここに定義
}

export default function ChartSection() {
  // メモ化されたセレクターを使用してデータと状態を取得
  const currentSymbol = useChartDataStore(selectChartCurrentSymbol);
  const currentTimeFrame = useChartDataStore(selectCurrentTimeFrame);
  const isLoading = useChartDataStore(selectIsLoading);
  const error = useChartDataStore(selectError);
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);
  const dateRange = useChartDataStore(selectDateRange);
  const chartType = useChartConfigStore(selectChartType);
  
  // メモ化されたセレクターを使用してアクションを取得
  const updateTimeFrame = useChartDataStore(selectUpdateTimeFrame);
  const updateSymbol = useChartDataStore(selectUpdateSymbol);
  const fetchData = useChartDataStore(selectFetchData);
  const setChartType = useChartConfigStore(selectSetChartType);
  const stopRealTimeUpdates = useRealTimeStore(selectStopRealTimeUpdates);

  // コンポーネントのマウント時とタイムフレーム・シンボル変更時にチャートを初期化
  useEffect(() => {
    // データの取得
    fetchData(currentSymbol, currentTimeFrame);
    // 依存配列に関数と状態を追加して不要な再実行を防止
  }, [fetchData, currentSymbol, currentTimeFrame]);
  
  // クリーンアップロジックを別のエフェクトに分離
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();
    };
  }, [stopRealTimeUpdates]);

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

  // 型安全な実装に変更
  const handleChartTypeChange = (type: string) => {
    if (isValidChartType(type)) {
      setChartType(type);
    }
  };
  
  // 型安全性を確保するためのヘルパー関数
  const isValidChartType = (type: string): type is ChartType => {
    return ['candle', 'line', 'area'].includes(type);
  };

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* メタ情報を表示するヘッダーセクション */}
      <div className="px-4 py-2 bg-[#131722] border-b border-[#2A2E39]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-white">{currentSymbol}</h2>
            {currentPrice > 0 && (
              <span className="ml-2 text-lg font-mono">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            {priceChangePercent !== 0 && (
              <Badge className="ml-2" variant={priceChangePercent >= 0 ? "success" : "destructive"}>
                {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </Badge>
            )}
          </div>
          {dateRange && (
            <div className="text-xs text-[#9CA3AF]">
              {formatTimestamp(dateRange[0] instanceof Date ? dateRange[0].getTime() / 1000 : dateRange[0])} - 
              {formatTimestamp(dateRange[1] instanceof Date ? dateRange[1].getTime() / 1000 : dateRange[1])}
            </div>
          )}
        </div>
      </div>
      
      {/* ChartToolbarはメインレイアウトに移動しました */}
      
      <div className="relative flex-grow">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2962FF]"></div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
            <div className="text-red-500 text-center p-4">
              <p className="text-lg font-semibold">Error loading chart data</p>
              <p className="text-sm">{error}</p>
              <button 
                className="mt-2 px-4 py-2 bg-[#2962FF] text-white rounded"
                onClick={() => fetchData(currentSymbol, currentTimeFrame)}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <ChartCanvas />
        )}
      </div>
    </div>
  );
}
