// utils/position.ts
// 作成: ポジション関連のユーティリティ関数

import type { Entry, TradeSide } from "@/types/entry";

/**
 * トレードポジションの利益を計算する
 * @param entry エントリー情報
 * @param getCurrentPrice 現在価格を取得する関数（オプション）
 * @returns 利益額
 */
export function calculateProfit(entry: Entry, getCurrentPrice?: (price: number) => number): number {
  if (entry.status === "closed" && entry.exitPrice) {
    return entry.side === "buy" ? entry.exitPrice - entry.price : entry.price - entry.exitPrice;
  }

  // オープンポジションの場合は現在価格で計算
  if (getCurrentPrice) {
    const currentPrice = getCurrentPrice(entry.price);
    return entry.side === "buy" ? currentPrice - entry.price : entry.price - currentPrice;
  }

  return 0;
}

/**
 * トレードポジションの利益率を計算する
 * @param entry エントリー情報
 * @param profit 利益額
 * @returns 利益率（パーセンテージ）
 */
export function calculateProfitPercentage(entry: Entry, profit: number): number {
  return (profit / entry.price) * 100;
}

/**
 * ポジションのリスク/リワード比を計算する
 * @param entry エントリー情報
 * @returns リスク/リワード比
 */
export function calculateRiskRewardRatio(entry: Entry): number | null {
  if (!entry.takeProfit || !entry.stopLoss) return null;
  
  const reward = entry.side === "buy" 
    ? entry.takeProfit - entry.price 
    : entry.price - entry.takeProfit;
    
  const risk = entry.side === "buy" 
    ? entry.price - entry.stopLoss 
    : entry.stopLoss - entry.price;
  
  if (risk <= 0) return null;
  
  return reward / risk;
}

/**
 * ポジションの状態に基づいて表示用のラベルを取得する
 * @param status ポジションの状態
 * @returns 表示用ラベル
 */
export function getStatusLabel(status: Entry["status"]): string {
  switch (status) {
    case "open":
      return "オープン";
    case "closed":
      return "クローズド";
    case "canceled":
      return "キャンセル";
    default:
      return "不明";
  }
}
