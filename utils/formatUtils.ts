// utils/formatUtils.ts
// 作成: フォーマット関連のユーティリティ関数を統合
// 
// このファイルは以下のフォーマット関連の機能を提供します:
// - 数値フォーマット (formatNumber, formatPercentage)
// - 価格フォーマット (formatPrice)
// - 日付フォーマット (formatDate, getRelativeTimeString)

import type { PriceFormatOptions, DateFormat } from "@/types/common";

/**
 * 数値を指定された小数点以下の桁数でフォーマットする
 * @param num フォーマットする数値
 * @param digits 小数点以下の桁数
 * @returns フォーマットされた数値文字列
 */
export const formatNumber = (num: number, digits: number = 2): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/**
 * パーセンテージをフォーマットする
 * @param value パーセンテージ値
 * @param digits 小数点以下の桁数
 * @param includeSymbol %記号を含めるかどうか
 * @returns フォーマットされたパーセンテージ文字列
 */
export const formatPercentage = (
  value: number,
  digits: number = 2,
  includeSymbol: boolean = true
): string => {
  const formatted = formatNumber(value, digits);
  return includeSymbol ? `${formatted}%` : formatted;
};

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

  const formattedNumber = formatNumber(price, precision);
  const symbol = currencySymbols[currency] || currency;

  return showSymbol ? `${symbol}${formattedNumber}` : formattedNumber;
};

/**
 * 相対的な時間表現を取得する（例: "3分前", "1時間前"）
 * @param date 日付オブジェクト
 * @returns 相対的な時間表現
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return `${diffSec}秒前`;
  } else if (diffMin < 60) {
    return `${diffMin}分前`;
  } else if (diffHour < 24) {
    return `${diffHour}時間前`;
  } else if (diffDay < 30) {
    return `${diffDay}日前`;
  } else {
    // 1ヶ月以上前の場合は日付を表示
    return date.toLocaleDateString("ja-JP");
  }
};

/**
 * 日付文字列を指定されたフォーマットで表示する
 * @param dateString ISO形式の日付文字列またはタイムスタンプ
 * @param format 表示形式 ("iso", "locale", "relative")
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (
  dateInput: string | number | Date, 
  format: DateFormat = "locale"
): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
  switch (format) {
    case "iso":
      return date.toISOString();
      
    case "locale":
      return date.toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      
    case "relative":
      return getRelativeTimeString(date);
      
    default:
      return date.toLocaleString();
  }
};
