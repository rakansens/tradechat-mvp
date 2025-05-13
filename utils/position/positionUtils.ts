"use client"

import type { Entry } from "@/types"

// 日付をフォーマット
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

// 利益/損失を計算
export function calculateProfit(entry: Entry, getCurrentPrice?: (price: number) => number): number {
  if (entry.status === "closed" && entry.exitPrice) {
    return entry.side === "buy" ? entry.exitPrice - entry.price : entry.price - entry.exitPrice
  }

  // オープンポジションの場合は現在価格で計算
  if (getCurrentPrice) {
    const currentPrice = getCurrentPrice(entry.price)
    return entry.side === "buy" ? currentPrice - entry.price : entry.price - currentPrice
  }

  return 0
}

// 利益/損失の割合を計算
export function calculateProfitPercentage(entry: Entry, profit: number): number {
  return (profit / entry.price) * 100
}
