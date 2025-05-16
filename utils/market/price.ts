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
  price: number | string,
  options: PriceFormatOptions = {}
): string => {
  const { currency = '¥', precision = 2, showSymbol = true } = options;
  
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  
  const formattedNumber = num.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true
  });
  
  return showSymbol ? `${currency}${formattedNumber}` : formattedNumber;
};

/**
 * 利益率を計算する
 * @param entryPrice エントリー価格
 * @param currentPrice 現在価格
 * @returns 利益率（0-1の値）
 */
export const calculateProfitPercentage = (
  entryPrice: number,
  currentPrice: number
): number => {
  if (entryPrice === 0) return 0;
  return (currentPrice - entryPrice) / entryPrice;
};

/**
 * 価格変動率を計算する
 * @param previousPrice 前回の価格
 * @param currentPrice 現在の価格
 * @returns 価格変動率（0-1の値）
 */
export const calculatePriceChangePercentage = (
  previousPrice: number,
  currentPrice: number
): number => {
  if (previousPrice === 0) return 0;
  return (currentPrice - previousPrice) / previousPrice;
};

/**
 * 損益分岐点を計算する
 * @param entryPrice エントリー価格
 * @param feeRate 手数料率（0-1の値）
 * @returns 損益分岐点の価格
 */
export const calculateBreakEvenPrice = (
  entryPrice: number,
  feeRate: number
): number => {
  return entryPrice * (1 + feeRate);
};
