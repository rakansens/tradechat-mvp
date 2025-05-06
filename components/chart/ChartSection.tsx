// components/chart/ChartSection.tsx
// 更新: 共通インターフェースを使用するように修正
"use client"

import React, { useMemo, useState, useEffect } from 'react';
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
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  selectDateRange,
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
  // チャートデータ関連の状態とアクション
  const { 
    currentSymbol, 
    currentTimeFrame,
    updateTimeFrame, 
    updateSymbol,
    fetchData,
    isLoading,
    error
  } = useChartDataStore();
  
  // メモ化されたセレクターを使用してデータを取得
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

  // コンポーネントのマウント時にチャートを初期化
  // 初期化とクリーンアップを分離して最適化
  useEffect(() => {
    // リアルタイム更新用のAPIクライアントを初期化
    initializeApi(exchangeType);
    
    // 初期データの取得
    fetchData(currentSymbol, currentTimeFrame);
  }, []);
  
  // クリーンアップロジックを別のエフェクトに分離
  useEffect(() => {
    return () => {
      stopRealTimeUpdates();
    };
  }, [stopRealTimeUpdates]);
  
  // exchangeTypeが変更されたときにリアルタイムAPIクライアントを再初期化
  useEffect(() => {
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
    return ['candle', 'line', 'area'].includes(type);
  };

  // 表示幅とレスポンシブ設定用の状態
  const [chartWidth, setChartWidth] = useState(75); // チャート幅（％）
  const [orderBookWidth, setOrderBookWidth] = useState(25); // オーダーブック幅（％）
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズに応じたレイアウト調整
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      if (isMobileView) {
        // モバイルでは下部に表示
        setChartWidth(100);
        setOrderBookWidth(100);
      } else if (window.innerWidth < 1024) {
        // タブレットサイズレイアウト
        setChartWidth(70);
        setOrderBookWidth(30);
      } else {
        // デスクトップレイアウト
        setChartWidth(75);
        setOrderBookWidth(25);
      }
    };
    
    // 初期設定
    checkIfMobile();
    
    // リサイズイベントのリスナー設定
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
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
      <div className={`relative flex flex-grow ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* チャート部分 */}
        <div style={{ position: 'relative', width: isMobile ? '100%' : `${chartWidth}%`, height: isMobile ? '50%' : '100%' }}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2962FF]"></div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
              <div className="text-center p-4">
                <p className="text-2xl font-semibold text-red-500">Error loading chart data</p>
                <p className="text-base mt-2 mb-4">{error}</p>
                
                {/* 先物取引でサポートされていない銘柄の場合は現物取引に切り替えるボタンを表示 */}
                {error?.includes('先物取引で利用できません') || error?.includes('先物取引でサポートされていません') ? (
                  <div className="flex flex-col space-y-2 items-center">
                    <button 
                      className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      onClick={() => {
                        setExchangeType('spot');
                        fetchData(currentSymbol, currentTimeFrame);
                      }}
                    >
                      現物取引に切り替える
                    </button>
                    <span className="text-sm text-gray-400 mt-1">または</span>
                  </div>
                ) : null}
                
                <button 
                  className="mt-2 px-6 py-3 bg-[#2962FF] text-white rounded-md hover:bg-blue-700 transition-colors"
                  onClick={() => fetchData(currentSymbol, currentTimeFrame)}
                >
                  再試行
                </button>
              </div>
            </div>
          ) : (
            <ChartCanvas />
          )}
        </div>
        
        {/* オーダーブック部分 */}
        <div 
          style={{ 
            width: isMobile ? '100%' : `${orderBookWidth}%`, 
            height: isMobile ? '50%' : '100%',
            borderLeft: '1px solid #2A2E39',
            backgroundColor: '#131722'
          }}
        >
          <div className="h-full flex flex-col">
            <OrderBook 
              depth={15} 
              className="h-full"
              orderBookWidth={orderBookWidth}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
