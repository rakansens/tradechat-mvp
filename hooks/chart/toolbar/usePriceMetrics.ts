/**
 * hooks/chart/toolbar/usePriceMetrics.ts
 * 
 * チャートデータから現在価格と変化率を計算するためのフック
 * 
 * 変更履歴:
 * - 2023-06-15: 初期実装
 * - 2025-05-15: フックのリファクタリングに伴いhooks/chart/toolbarディレクトリに移動
 */

import { useEffect, useState } from 'react';
import type { OHLCData } from '@/types/chart';

/**
 * チャートデータから現在価格と変化率を計算するフック
 * @param data OHLC（ローソク足）データの配列
 * @returns 現在価格と変化率（パーセント）
 */
export function usePriceMetrics(data: OHLCData[] = []) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);

  useEffect(() => {
    if (data.length > 0) {
      const latestData = data[data.length - 1];
      
      // 現在の価格を設定
      setCurrentPrice(latestData.close);
      
      // 前日比の計算
      if (data.length > 1) {
        const previousClose = data[data.length - 2].close;
        if (previousClose > 0) {
          const changePercent = ((latestData.close - previousClose) / previousClose) * 100;
          setPriceChangePercent(parseFloat(changePercent.toFixed(2)));
        }
      }
    }
  }, [data]);

  return { currentPrice, priceChangePercent };
}