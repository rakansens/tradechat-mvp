// components/chart/ChartSection.tsx
// 更新: UI/UXの一貫性向上 - エラーハンドリングの統一とレスポンシブデザインの実装方法の統一
"use client"

import React, { useMemo, useEffect } from 'react';
import { getTimeframeDisplayName } from "@/utils/ohlcDummyData"
import ChartCanvas from "@/components/chart/ChartCanvas"
import type { Entry } from "@/types/entry"
import type { Timeframe, ChartType } from "@/types/chart"
import type { ChartViewProps, TimeframeControlProps, ChartTypeControlProps } from "@/types/common-interfaces"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, CandlestickChart, LineChart } from "lucide-react"
import ErrorDisplay from "@/components/common/ErrorDisplay"
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
  selectStopRealTimeUpdates,
  // マーケットデータストア
  useMarketStore
} from "@/store"
import { theme } from "@/styles/colors"
import ChartToolbar from "./ChartToolbar"
import { OrderBook } from "@/components/market"
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
  
  // チャート設定関連の状態とアクション
  const { 
    chartType,
    setChartType,
    exchangeType,
    setExchangeType 
  } = useChartConfigStore();
  
  // リアルタイム更新関連のアクション
  const {
    stopRealTimeUpdates,
    initializeApi
  } = useRealTimeStore();
  
  // オーダーブック関連の状態とアクション
  const {
    setCurrentSymbol: setMarketSymbol,
    setExchangeType: setMarketExchangeType,
    fetchOrderBook,
    isLoadingOrderBook,
    orderBookError
  } = useMarketStore();

  // メモ化されたセレクターを使用してアクションを取得
  const updateTimeFrame = useChartDataStore(selectUpdateTimeFrame);
  const updateSymbol = useChartDataStore(selectUpdateSymbol);
  const fetchData = useChartDataStore(selectFetchData);

  // コンポーネントのマウント時とタイムフレーム・シンボル変更時にチャートを初期化
  useEffect(() => {
    // 共通のソケットサービスを使用してAPIクライアントを初期化
    // initializeApiはuseRealTimeStoreのアクションを使用
    initializeApi(exchangeType);
    
    // 初期データの取得
    fetchData(currentSymbol, currentTimeFrame);
    // 依存配列に関数と状態を追加して不要な再実行を防止
  }, [fetchData, currentSymbol, currentTimeFrame, initializeApi, exchangeType]);

  // クリーンアップロジックを別のエフェクトに分離
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();
    };
  }, [stopRealTimeUpdates]);
  
  // exchangeTypeが変更されたときにリアルタイムAPIクライアントを再初期化
  useEffect(() => {
    // 共通のソケットサービスを使用してAPIクライアントを初期化
    initializeApi(exchangeType);
    // マーケットストアの取引タイプも更新
    setMarketExchangeType(exchangeType);
  }, [exchangeType, initializeApi, setMarketExchangeType]);
  
  // シンボルが変更されたときにオーダーブックも更新
  useEffect(() => {
    // マーケットストアのシンボルを更新
    setMarketSymbol(currentSymbol);
    // オーダーブックデータを取得
    fetchOrderBook();
  }, [currentSymbol, setMarketSymbol, fetchOrderBook]);

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
    return ['candles', 'line', 'bar', 'area'].includes(type);
  };

  // インジケーターと価格表示の共通スタイル
  const commonStyles = useMemo(() => {
    return {
      background: theme.background.card,
      border: `1px solid ${theme.border.light}`,
      color: theme.text.primary
    };
  }, []);

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
      
      {/* チャートとオーダーブックを横並びに配置（レスポンシブ対応） */}
      <div className="relative flex flex-grow flex-col md:flex-row">
        {/* チャート部分 */}
        <div className="relative w-full h-1/2 md:h-full md:w-3/4 lg:w-3/4">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2962FF]"></div>
            </div>
          ) : error ? (
            <ErrorDisplay
              error={error}
              onRetry={() => fetchData(currentSymbol, currentTimeFrame)}
              alternativeActions={
                error?.includes('先物取引で利用できません') || error?.includes('先物取引でサポートされていません')
                  ? [
                      {
                        label: '現物取引に切り替える',
                        action: () => {
                          setExchangeType('spot');
                          fetchData(currentSymbol, currentTimeFrame);
                        }
                      }
                    ]
                  : undefined
              }
            />
          ) : (
            <ChartCanvas />
          )}
        </div>
        
        {/* オーダーブック部分 */}
        <div className="w-full h-1/2 md:h-full md:w-1/4 lg:w-1/4 border-t md:border-t-0 md:border-l border-[#2A2E39] bg-[#131722]">
          <div className="h-full flex flex-col">
            <OrderBook 
              depth={15} 
              className="h-full"
              orderBookWidth={25}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
