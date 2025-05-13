/**
 * components/chart/sections/ChartSection/index.tsx
 * チャートセクションのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 * - 更新: フックパスをリファクタリング後のパスに更新
 */

"use client"

import React, { useState, useEffect } from 'react';
import { useChartSectionStores } from '@/hooks/chart/canvas';
import { useChartSectionInit } from '@/hooks/chart/canvas';
import { useChartSectionCleanup } from '@/hooks/chart/init';
import { ChartHeader } from './ChartHeader';
import { ChartBody } from './ChartBody';
import { logger } from '@/utils/common';

/**
 * チャートセクションのメインコンポーネント
 * 
 * フックとUI要素を統合し、チャートセクション全体を構成します。
 * ストアから取得したデータをUIに渡し、イベント処理も担当します。
 */
export default function ChartSection() {
  // クライアントサイドでのみシンボルを表示するための状態
  const [mounted, setMounted] = useState(false);
  
  // クライアントサイドでのみ実行される処理
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // ストアからデータと状態を取得
  const {
    symbolStore,
    chartDataStore,
    configStore,
    realTimeStore,
    derivedData
  } = useChartSectionStores();
  
  // チャートの初期化と更新
  const { fetchData } = useChartSectionInit({
    currentSymbol: symbolStore.currentSymbol,
    currentTimeFrame: chartDataStore.currentTimeFrame,
    exchangeType: symbolStore.exchangeType,
    initializeApi: realTimeStore.initializeApi,
    fetchChartData: chartDataStore.fetchChartData
  });
  
  // クリーンアップ処理
  useChartSectionCleanup({
    stopRealTimeUpdates: realTimeStore.stopRealTimeUpdates
  });
  
  // 再試行用のハンドラー
  const handleRetry = () => {
    logger.info('チャートデータの取得を再試行します', {
      component: 'ChartSection',
      action: 'handleRetry',
      symbol: symbolStore.currentSymbol,
      timeframe: chartDataStore.currentTimeFrame
    });
    
    fetchData();
  };

  return (
    <div className="relative flex flex-col w-full h-full">
      {/* ヘッダー部分: シンボル情報と価格データを表示 */}
      <ChartHeader
        currentSymbol={symbolStore.currentSymbol}
        currentPrice={derivedData.currentPrice}
        priceChangePercent={derivedData.priceChangePercent}
        formattedDateRange={derivedData.formattedDateRange}
        mounted={mounted}
      />
      
      {/* ボディ部分: チャートとオーダーブック */}
      <ChartBody
        isLoading={chartDataStore.isLoading}
        error={chartDataStore.error}
        currentSymbol={symbolStore.currentSymbol}
        currentTimeFrame={chartDataStore.currentTimeFrame}
        setExchangeType={symbolStore.setExchangeType}
        onRetry={handleRetry}
      />
    </div>
  );
} 