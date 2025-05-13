// utils/chart.ts
// 作成: チャート関連のユーティリティ関数

import type { Timeframe } from "@/types";

/**
 * 指定されたタイムフレームに対する適切なデータポイント数を返す
 * @param timeframe チャートのタイムフレーム
 * @returns データポイント数
 */
export const getDataPointsForTimeframe = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case "1d":
      return 30; // 30日分
    case "4h":
      return 48; // 8日分 (48 * 4時間 = 192時間 = 8日)
    case "1h":
      return 48; // 2日分
    case "15m":
      return 96; // 24時間分
    case "5m":
      return 96; // 8時間分
    case "1m":
      return 60; // 1時間分
    default:
      return 30;
  }
};

/**
 * 価格データから移動平均を計算する
 * @param prices 価格データの配列
 * @param period 移動平均の期間
 * @returns 移動平均値の配列
 */
export const calculateMA = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN); // 期間に満たない場合はNaN
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    result.push(sum / period);
  }
  return result;
};
