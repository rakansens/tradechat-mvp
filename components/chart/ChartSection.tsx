// components/chart/ChartSection.tsx
// 更新: 新しいストア構造に対応するように修正
// 変更内容:
// 1. useChartDataStoreを直接使用するように変更
// 2. 循環参照を解消
// 3. 非同期処理の問題を解決
// 4. ハイドレーションエラーの修正
// 5. ChartCanvasへの正しいprops受け渡しの追加
// 6. レイアウトとスタイルの最適化
"use client"

import React, { useMemo, useEffect, useState } from 'react';
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
  // チャート関連のストア
  useChartConfigStore,
  useRealTimeStore,
  useChartDataStore,
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
import { useSymbolStore } from "@/store/useSymbolStore"
import { theme } from "@/styles/colors"
import ChartToolbar from "./ChartToolbar"
import { OrderBook } from "@/components/market"
import { formatTimestamp, ensureMilliseconds } from "@/utils/chartUtils"

// 共通インターフェースを組み合わせて使用
interface ChartSectionProps extends ChartViewProps, Pick<TimeframeControlProps, 'timeframe'> {
  // 追加のプロパティがあればここに定義
}

export default function ChartSection() {
  // クライアントサイドでのみシンボルを表示するための状態
  const [mounted, setMounted] = useState(false);
  
  // クライアントサイドでのみ実行される処理
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 各ドメインストアからデータと状態を取得
  const currentSymbol = useSymbolStore(state => state.currentSymbol);
  const currentTimeFrame = useChartDataStore(state => state.currentTimeFrame);
  
  // ChartDataStoreからデータと状態を取得
  const chartData = useChartDataStore(state => state.data);
  const isLoading = useChartDataStore(state => state.isLoading);
  const error = useChartDataStore(state => state.error);
  
  // 価格情報を計算
  const currentPrice = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData[chartData.length - 1].close;
  }, [chartData]);
  
  // 価格変化率を計算
  const priceChangePercent = useMemo(() => {
    if (!chartData || chartData.length < 2) return 0;
    const lastPrice = chartData[chartData.length - 1].close;
    const firstPrice = chartData[0].open;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }, [chartData]);
  
  // 日付範囲を計算
  const dateRange = useMemo<[number, number] | null>(() => {
    if (!chartData || chartData.length < 2) return null;
    return [chartData[0].time, chartData[chartData.length - 1].time];
  }, [chartData]);
  
  // 各ドメインストアからアクションを取得
  const updateTimeFrame = useChartDataStore(state => state.updateTimeFrame);
  const setCurrentSymbol = useSymbolStore(state => state.setCurrentSymbol);
  const exchangeType = useSymbolStore(state => state.exchangeType);
  const setExchangeType = useSymbolStore(state => state.setExchangeType);
  
  // ChartDataStoreからアクションを取得
  const fetchChartData = useChartDataStore(state => state.fetchData);
  
  // 後方互換性のために残すストアからデータを取得
  // チャート設定関連の状態とアクション
  const { 
    chartType,
    setChartType
  } = useChartConfigStore();
  
  // リアルタイム更新関連のアクション
  const {
    stopRealTimeUpdates,
    initializeApi
  } = useRealTimeStore();

  // コンポーネントのマウント時とタイムフレーム・シンボル変更時にチャートを初期化
  useEffect(() => {
    // 共通のソケットサービスを使用してAPIクライアントを初期化
    // initializeApiはuseRealTimeStoreのアクションを使用
    initializeApi(exchangeType);
    
    // 初期データの取得
    // 最新のシンボルとタイムフレームを取得して使用
    const latestSymbol = useSymbolStore.getState().currentSymbol;
    const latestTimeFrame = useChartDataStore.getState().currentTimeFrame;
    
    console.log(`ChartSection: Fetching data with latest symbol: ${latestSymbol}, timeframe: ${latestTimeFrame}`);
    
    // useChartDataStoreのfetchDataを使用
    if (fetchChartData && typeof fetchChartData === 'function') {
      fetchChartData(latestSymbol, latestTimeFrame);
    } else {
      console.error('fetchChartData is not a function', fetchChartData);
    }
    
    // 依存配列に関数と状態を追加して不要な再実行を防止
  }, [fetchChartData, currentSymbol, currentTimeFrame, initializeApi, exchangeType]);

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
  }, [exchangeType, initializeApi]);
  
  // 注意: このuseEffectは削除
  // シンボル更新は handleSymbolChange メソッドで一元管理するため、
  // このuseEffectによる二重更新を防止する

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
    console.log(`ChartSection: handleSymbolChange called with symbol: ${symbol}`);
    
    // AppStoreを使用して一元管理
    setCurrentSymbol(symbol);
    
    // デバッグログ
    console.log(`ChartSection: Symbol updated in app store to ${symbol}`);
  };

  // 型安全な実装に変更
  const handleChartTypeChange = (type: string) => {
    if (isValidChartType(type)) {
      setChartType(type);
    }
  };
  
  // 後方互換性のためのコードは削除（AppStoreで一元管理するため）

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

  // クライアントサイドでのみ計算する値
  const displayPriceChangePercent = mounted ? priceChangePercent : 0;

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden">
      {/* メタ情報を表示するヘッダーセクション */}
      <div className="flex-shrink-0 px-4 py-2 bg-[#131722] border-b border-[#2A2E39]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-white">{mounted ? currentSymbol : ''}</h2>
            {mounted && currentPrice > 0 && (
              <span className="ml-2 text-lg font-mono">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            {mounted && displayPriceChangePercent !== 0 && (
              <Badge className="ml-2" variant={displayPriceChangePercent >= 0 ? "success" : "destructive"}>
                {displayPriceChangePercent >= 0 ? '+' : ''}{displayPriceChangePercent.toFixed(2)}%
              </Badge>
            )}
          </div>
          {mounted && dateRange && (
            <div className="text-xs text-[#9CA3AF]">
              {formatTimestamp(dateRange[0])} -
              {formatTimestamp(dateRange[1])}
            </div>
          )}
        </div>
      </div>

      {/* ChartToolbarはメインレイアウトに移動しました */}
      
      {/* チャートとオーダーブックを横並びに配置（レスポンシブ対応） */}
      <div className="flex-grow flex flex-col md:flex-row w-full h-[calc(100%-50px)] min-h-0">
        {/* チャート部分 */}
        <div className="relative w-full h-1/2 md:h-full md:w-3/4 lg:w-3/4 flex-grow overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80 z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2962FF]"></div>
            </div>
          ) : error ? (
            <ErrorDisplay
              error={error}
              onRetry={() => {
                // 最新のシンボルとタイムフレームを取得して使用
                const latestSymbol = useSymbolStore.getState().currentSymbol;
                const latestTimeFrame = useChartDataStore.getState().currentTimeFrame;
                console.log(`ChartSection: Retrying with latest symbol: ${latestSymbol}, timeframe: ${latestTimeFrame}`);
                
                // useChartDataStoreのfetchDataを使用
                if (fetchChartData && typeof fetchChartData === 'function') {
                  fetchChartData(latestSymbol, latestTimeFrame);
                }
              }}
              alternativeActions={
                error?.includes('先物取引で利用できません') || error?.includes('先物取引でサポートされていません')
                  ? [
                      {
                        label: '現物取引に切り替える',
                        action: () => {
                          setExchangeType('spot');
                          
                          // useChartDataStoreのfetchDataを使用
                          if (fetchChartData && typeof fetchChartData === 'function') {
                            fetchChartData(currentSymbol, currentTimeFrame);
                          }
                        }
                      }
                    ]
                  : undefined
              }
            />
          ) : (
            <div className="w-full h-full" style={{ minHeight: '400px' }}>
              <ChartCanvas 
                className="w-full h-full"
                symbol={currentSymbol}
                chartType={chartType} 
                timeframe={currentTimeFrame}
              />
            </div>
          )}
        </div>
        
        {/* オーダーブック部分 */}
        <div className="w-full h-1/2 md:h-full md:w-1/4 lg:w-1/4 border-t md:border-t-0 md:border-l border-[#2A2E39] bg-[#131722] flex-shrink-0 overflow-auto">
          <div className="h-full flex flex-col">
            <div className="p-2 border-b border-[#2A2E39] bg-[#1C2030] text-white font-medium">
              オーダーブック
            </div>
            <OrderBook
              depth={15}
              className="h-full overflow-auto"
              orderBookWidth="25%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
