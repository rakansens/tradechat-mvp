// utils/price.ts
// 作成: 価格関連のユーティリティ関数

import type { PriceFormatOptions } from "@/types/common";

/**
 * 価格を指定されたフォーマットで表示する
 * @param price 価格
 * @param options フォーマットオプション
 * @returns フォーマットされた価格文字列
 */
export const formatPrice = (
  price: number,
  options: PriceFormatOptions = {}
): string => {
  const {
    currency = "USD",
    precision = 2,
    showSymbol = true,
  } = options;

  // 通貨記号のマッピング
  const currencySymbols: Record<string, string> = {
    USD: "$",
    JPY: "¥",
    EUR: "€",
    GBP: "£",
    BTC: "₿",
    ETH: "Ξ",
  };

  // 通貨記号
  const symbol = currencySymbols[currency] || currency;

  // 価格をフォーマット
  const formattedPrice = price.toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  // 通貨記号を表示するかどうか
  return showSymbol ? `${symbol}${formattedPrice}` : formattedPrice;
};

/**
 * 利益率を計算する
 * @param entryPrice エントリー価格
 * @param exitPrice 決済価格
 * @param side 取引方向（"buy" または "sell"）
 * @returns 利益率（パーセンテージ）
 */
export const calculateProfitPercentage = (
  entryPrice: number,
  exitPrice: number,
  side: "buy" | "sell"
): number => {
  if (entryPrice === 0) return 0;

  const profitRatio =
    side === "buy"
      ? (exitPrice - entryPrice) / entryPrice
      : (entryPrice - exitPrice) / entryPrice;

  return profitRatio * 100;
};

/**
 * 価格変化率を計算する
 * @param oldPrice 古い価格
 * @param newPrice 新しい価格
 * @returns 変化率（パーセンテージ）
 */
export const calculatePriceChangePercentage = (
  oldPrice: number,
  newPrice: number
): number => {
  if (oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
};

/**
 * 損益分岐点を計算する
 * @param entryPrice エントリー価格
 * @param side 取引方向（"buy" または "sell"）
 * @param feePercentage 取引手数料率（パーセンテージ）
 * @returns 損益分岐点の価格
 */
export const calculateBreakEvenPrice = (
  entryPrice: number,
  side: "buy" | "sell",
  feePercentage: number = 0.1
): number => {
  const feeMultiplier = feePercentage / 100;
  
  if (side === "buy") {
    // 買いポジションの場合、エントリー価格 * (1 + 手数料率 * 2)
    return entryPrice * (1 + feeMultiplier * 2);
  } else {
    // 売りポジションの場合、エントリー価格 * (1 - 手数料率 * 2)
    return entryPrice * (1 - feeMultiplier * 2);
  }
};
