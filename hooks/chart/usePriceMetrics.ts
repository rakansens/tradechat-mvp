// hooks/chart/usePriceMetrics.ts
// 作成: チャートデータから現在価格と変化率を計算するカスタムフック
// 役割:
// 1. 現在価格（最新のロウソク足終値）を計算
// 2. 価格変化率（最初と最後のローソク足の差分）を計算

import { useMemo } from 'react';
import { OHLCData } from '@/types/chart';

/**
 * チャートデータから現在価格と価格変化率を計算するカスタムフック
 * @param chartData チャートデータ配列
 * @returns 現在価格と価格変化率（%）
 */
export function usePriceMetrics(chartData: OHLCData[] | null) {
  // 現在価格を計算（最新のローソク足の終値）
  const currentPrice = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData[chartData.length - 1].close;
  }, [chartData]);
  
  // 価格変化率を計算（%）
  const priceChangePercent = useMemo(() => {
    if (!chartData || chartData.length < 2) return 0;
    const lastPrice = chartData[chartData.length - 1].close;
    const firstPrice = chartData[0].open;
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }, [chartData]);
  
  return { 
    currentPrice,
    priceChangePercent
  };
}

export default usePriceMetrics; 