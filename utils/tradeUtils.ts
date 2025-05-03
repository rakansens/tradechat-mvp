"use client"

// utils/tradeUtils.ts
// 作成: トレードとポジション関連のユーティリティ関数を統合
// 
// このファイルは以下のトレード関連の機能を提供します:
// - ポジション利益計算
// - リスク/リワード計算
// - ポジション状態管理
// - トレード統計計算

import type { Entry, TradeSide, EntryStatus } from "@/types/entry";
import { formatDate as formatDateUtil } from "./formatUtils";

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
export function getStatusLabel(status: EntryStatus): string {
  switch (status) {
    case "open":
      return "オープン";
    case "closed":
      return "クローズド";
    case "canceled":
      return "キャンセル";
    default:
      return status;
  }
}

/**
 * トレード方向に基づいて表示用のラベルを取得する
 * @param side トレード方向
 * @returns 表示用ラベル
 */
export function getSideLabel(side: TradeSide): string {
  return side === "buy" ? "買い" : "売り";
}

/**
 * ポジションのエントリー日時を表示用にフォーマットする
 * @param entry エントリー情報
 * @returns フォーマットされた日時文字列
 */
export function formatEntryDate(entry: Entry): string {
  return formatDateUtil(entry.time, "locale");
}

/**
 * 複数のポジションから勝率を計算する
 * @param entries ポジションの配列
 * @returns 勝率（パーセンテージ）
 */
export function calculateWinRate(entries: Entry[]): number {
  const closedEntries = entries.filter(entry => entry.status === "closed");
  if (closedEntries.length === 0) return 0;
  
  const winningTrades = closedEntries.filter(entry => {
    const profit = calculateProfit(entry);
    return profit > 0;
  });
  
  return (winningTrades.length / closedEntries.length) * 100;
}

/**
 * 複数のポジションから平均利益率を計算する
 * @param entries ポジションの配列
 * @returns 平均利益率（パーセンテージ）
 */
export function calculateAverageProfitPercentage(entries: Entry[]): number {
  const closedEntries = entries.filter(entry => entry.status === "closed");
  if (closedEntries.length === 0) return 0;
  
  const totalProfitPercentage = closedEntries.reduce((sum, entry) => {
    const profit = calculateProfit(entry);
    const profitPercentage = calculateProfitPercentage(entry, profit);
    return sum + profitPercentage;
  }, 0);
  
  return totalProfitPercentage / closedEntries.length;
}
