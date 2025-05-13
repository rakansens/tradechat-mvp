/**
 * utils/chart/formatters.ts
 * チャートデータのフォーマット関数
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 */

import { OHLCData } from "@/types/chart";
import { UTCTimestamp } from "lightweight-charts";
import { logger } from '@/utils/common';

/**
 * OHLCデータをCandlestick用データに変換
 * @param data 検証済みOHLCデータ
 * @returns lighweight-charts用にフォーマットされたローソク足データ
 */
export function formatCandlestickData(data: OHLCData[]) {
  return data.map((item) => ({
    time: (item.time / 1000) as UTCTimestamp,
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
  }));
}

/**
 * OHLCデータをLine/Area用データに変換
 * @param data 検証済みOHLCデータ
 * @returns lighweight-charts用にフォーマットされたライン/エリアデータ
 */
export function formatLineData(data: OHLCData[]) {
  return data.map((item) => ({
    time: (item.time / 1000) as UTCTimestamp,
    value: Number(item.close),
  }));
}

/**
 * タイムフレームに基づく移動平均期間を取得
 * @param timeframe チャートのタイムフレーム
 * @returns 適切な移動平均期間
 */
export function getMAPeriodForTimeframe(timeframe: string): number {
  switch (timeframe) {
    case "1d":
      return 50
    case "4h":
      return 50
    case "1h":
      return 48
    case "15m":
      return 48
    case "5m":
      return 50
    case "1m":
      return 50
    default:
      return 50
  }
}

/**
 * エントリーマーカーを作成する関数
 * @param entries エントリーデータ配列
 * @returns SeriesMarker配列
 */
export function createEntryMarkers(entries: any[], colors: { green: string, red: string }) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) return [];
  
  return entries.map((entry) => ({
    time: (new Date(entry.time).getTime() / 1000) as UTCTimestamp,
    position: entry.side === "buy" ? "belowBar" : "aboveBar",
    color: entry.side === "buy" ? colors.green : colors.red,
    shape: entry.side === "buy" ? "arrowUp" : "arrowDown",
    text: entry.side === "buy" ? "BUY" : "SELL",
    size: 2,
  }));
}

/**
 * 決済マーカーを作成する関数
 * @param entries クローズされたエントリーデータ配列
 * @returns SeriesMarker配列
 */
export function createExitMarkers(entries: any[], colors: { green: string, red: string }) {
  if (!entries || !Array.isArray(entries) || entries.length === 0) return [];
  
  return entries
    .filter(entry => entry.status === "closed" && entry.exitTime)
    .map((entry) => ({
      time: (new Date(entry.exitTime).getTime() / 1000) as UTCTimestamp,
      position: entry.side === "buy" ? "aboveBar" : "belowBar",
      color: entry.profit > 0 ? colors.green : colors.red,
      shape: "circle",
      text: "EXIT",
      size: 2,
    }));
} 