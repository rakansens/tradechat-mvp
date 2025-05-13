// utils/date.ts
// 作成: 日付関連のユーティリティ関数

import type { DateFormat } from "@/types/common";

/**
 * 日付文字列を指定されたフォーマットで表示する
 * @param dateString ISO形式の日付文字列
 * @param format 表示形式 ("iso", "locale", "relative")
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (dateString: string, format: DateFormat = "locale"): string => {
  const date = new Date(dateString);
  
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

/**
 * 相対的な時間表現を返す（例: "3分前", "1時間前"）
 * @param date 日付オブジェクト
 * @returns 相対的な時間表現
 */
export const getRelativeTimeString = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) {
    return `${diffSec}秒前`;
  }
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}分前`;
  }
  
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}時間前`;
  }
  
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) {
    return `${diffDay}日前`;
  }
  
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth}ヶ月前`;
  }
  
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}年前`;
};

/**
 * タイムフレームに基づいて時間間隔をミリ秒で返す
 * @param timeframe タイムフレーム
 * @returns 時間間隔（ミリ秒）
 */
export const getTimeIntervalFromTimeframe = (timeframe: string): number => {
  const timeIntervalMap: Record<string, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };
  
  return timeIntervalMap[timeframe] || 60 * 1000; // デフォルトは1分
};
