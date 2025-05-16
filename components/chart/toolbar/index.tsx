"use client"

// components/chart/toolbar/index.tsx
// 作成: リファクタリングされたチャートツールバーコンポーネント
// 役割:
// 1. ストアとイベントを管理するフックを使用
// 2. サブコンポーネントを組み合わせてUIを構築
// 3. 状態とコールバックを適切なコンポーネントに渡す

import React, { memo, useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/styles/colors';
import { TabType } from '@/types/store';
import { Timeframe } from '@/types/chart';

// フックのインポート
import { 
  usePriceMetrics, 
  useToolbarStores, 
  useToolbarEvents 
} from '@/hooks/chart';

// UIコンポーネントのインポート
import SymbolPriceBar from './ui/SymbolPriceBar';
import TimeframeButtons from './ui/TimeframeButtons';
import ChartTabs from './ui/ChartTabs';
import IndicatorPopover from './ui/IndicatorPopover';
import ChartTypeSelector from './ui/ChartTypeSelector';
import RealtimeToggle from './ui/RealtimeToggle';
import TradeTypeSwitch from './ui/TradeTypeSwitch';

// 利用可能な時間足とチャートタイプ
const availableTimeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const chartTypes = ['candles', 'line', 'area'];

interface ChartToolbarProps {
  // タブ関連のprops（親コンポーネントから渡される）
  activeTab?: string
  onTabChange?: (tab: string) => void
}

/**
 * リファクタリングされたチャートツールバーコンポーネント
 */
const ChartToolbar = memo(function ChartToolbar({
  activeTab,
  onTabChange
}: ChartToolbarProps) {
  // クライアントサイドレンダリングを管理するstate
  const [mounted, setMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // マウント後に状態を更新
  useEffect(() => {
    setMounted(true);
    setIsClient(true);
  }, []);
  
  // イベントリスナーの設定
  useToolbarEvents();
  
  // ストアから状態とアクションを取得
  const {
    symbolStore,
    chartDataStore,
    chartConfigStore,
    indicatorStore,
    drawingToolStore,
    realTimeStore,
    entryStore
  } = useToolbarStores();
  
  // 価格計算フックを使用
  const { currentPrice, priceChangePercent } = usePriceMetrics(chartDataStore.chartData);
  
  return (
    <div className="flex flex-col w-full" style={{ backgroundColor: bg-background-card }}>
      {/* エラーメッセージ表示エリア */}
      {chartDataStore.error && (
        <div className="w-full px-4 py-1 bg-red-900/20 text-red-300 text-xs">
          {chartDataStore.error}
        </div>
      )}

      <div className="flex justify-between items-center py-2 px-3 border-b" style={{ borderColor: border-border-light, backgroundColor: bg-background-secondary }}>
        <SymbolPriceBar
          currentSymbol={symbolStore.currentSymbol}
          exchangeType={symbolStore.exchangeType}
          onSymbolChange={symbolStore.handleSymbolChange}
          onExchangeTypeChange={symbolStore.setExchangeType}
          currentPrice={currentPrice}
          priceChangePercent={priceChangePercent}
          mounted={mounted}
        />

        <div className="flex items-center space-x-2">
          {/* タイムフレーム選択 */}
          <TimeframeButtons
            availableTimeframes={availableTimeframes}
            currentTimeFrame={chartDataStore.currentTimeFrame}
            onTimeframeChange={(tf) => {
              console.log(`タイムフレーム変更: ${tf}`);
              if (chartDataStore.updateTimeFrame && typeof chartDataStore.updateTimeFrame === 'function') {
                chartDataStore.updateTimeFrame(tf as Timeframe);
              } else {
                console.error('updateTimeFrame is not a function', chartDataStore.updateTimeFrame);
              }
            }}
          />

          <Separator orientation="vertical" className="h-6 bg-[#374151]" />

          {/* チャート/ポジション切替タブ */}
          <ChartTabs
            activeTab={activeTab}
            onTabChange={onTabChange}
            openPositionsCount={entryStore.openPositionsCount}
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between px-3 py-1 border-b" style={{ borderColor: border-border-light, backgroundColor: bg-background-secondary }}>
        <div className="flex items-center space-x-4">
          {/* チャートタイプ選択 */}
          <ChartTypeSelector
            chartTypes={chartTypes}
            currentChartType={chartConfigStore.chartType}
            onChartTypeChange={chartConfigStore.setChartType}
          />

          {/* インジケーター選択ポップオーバー */}
          <IndicatorPopover
            isIndicatorActive={indicatorStore.isIndicatorActive}
            toggleIndicator={indicatorStore.toggleIndicator}
            activeDrawingTools={drawingToolStore.activeDrawingTools}
            toggleDrawingTool={drawingToolStore.toggleDrawingTool}
            clearAllDrawingTools={drawingToolStore.clearAllDrawingTools}
          />
          
          {/* リアルタイム更新切替ボタン */}
          <RealtimeToggle
            useRealTimeData={realTimeStore.useRealTimeData}
            toggleRealTimeData={realTimeStore.toggleRealTimeData}
          />
        </div>

        <div className="flex items-center">
          {/* 取引種別切り替えボタン */}
          <TradeTypeSwitch
            exchangeType={symbolStore.exchangeType}
            onExchangeTypeChange={symbolStore.setExchangeType}
            fetchChartData={(symbol, timeFrame, signal, useCache) => {
              return chartDataStore.fetchChartData(symbol, timeFrame as Timeframe, signal, useCache);
            }}
            currentSymbol={symbolStore.currentSymbol}
            currentTimeFrame={chartDataStore.currentTimeFrame}
            isClient={isClient}
          />
        </div>
      </div>
    </div>
  );
});

export default ChartToolbar; 