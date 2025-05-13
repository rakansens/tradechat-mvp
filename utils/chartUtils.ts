// utils/chartUtils.ts
// 作成: チャート関連のユーティリティ関数を統合
// 
// このファイルは以下のチャート関連の機能を提供します:
// - タイムフレーム関連の計算
// - テクニカル指標の計算（SMA, EMA, RSI, MACD, ボリンジャーバンド）
// - チャートデータの処理と変換
// - チャートシリーズの安全な削除と管理
// - タイムスタンプの重複排除と昇順ソート
// - SSR/CSR間で一貫した日付フォーマット

import type { Timeframe, OHLCData } from "@/types/chart";
import { IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { logger } from './logger';

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
 * 単純移動平均（SMA）を計算する
 * @param prices 価格の配列
 * @param period 期間
 * @returns 移動平均値の配列
 */
export const calculateSMA = (prices: number[], period: number): number[] => {
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

/**
 * 指数移動平均（EMA）を計算する
 * @param prices 価格の配列
 * @param period 期間
 * @returns 指数移動平均値の配列
 */
export const calculateEMA = (prices: number[], period: number): number[] => {
  const result: number[] = [];
  const k = 2 / (period + 1); // 平滑化定数
  
  // 最初のEMAはSMAとして計算
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN); // 期間に満たない場合はNaN
      continue;
    }
    
    if (i === period - 1) {
      result.push(ema);
      continue;
    }
    
    // EMA = 前日のEMA + 平滑化定数 * (今日の価格 - 前日のEMA)
    ema = ema + k * (prices[i] - ema);
    result.push(ema);
  }
  
  return result;
};

/**
 * 相対力指数（RSI）を計算する
 * @param prices 価格の配列
 * @param period 期間（通常14）
 * @returns RSI値の配列（0-100の範囲）
 */
export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // 価格変動を計算
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  // 平均上昇幅と平均下落幅を計算
  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      result.push(NaN); // 期間に満たない場合はNaN
      continue;
    }
    
    const avgGain = gains.slice(i - period, i).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((sum, loss) => sum + loss, 0) / period;
    
    if (avgLoss === 0) {
      result.push(100); // 下落なしの場合はRSI=100
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  }
  
  return result;
};

/**
 * MACD（移動平均収束拡散）を計算する
 * @param prices 価格の配列
 * @param fastPeriod 短期EMAの期間（通常12）
 * @param slowPeriod 長期EMAの期間（通常26）
 * @param signalPeriod シグナル線の期間（通常9）
 * @returns {macd, signal, histogram} MACDライン、シグナル線、ヒストグラムの配列
 */
export const calculateMACD = (
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[], signal: number[], histogram: number[] } => {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  // MACDライン = 短期EMA - 長期EMA
  const macd: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
      macd.push(NaN);
    } else {
      macd.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  // シグナル線 = MACDのEMA
  const signal = calculateEMA(macd.filter(val => !isNaN(val)), signalPeriod);
  
  // シグナル線の長さをMACDに合わせる
  const paddedSignal: number[] = [];
  for (let i = 0; i < prices.length - signal.length; i++) {
    paddedSignal.push(NaN);
  }
  paddedSignal.push(...signal);
  
  // ヒストグラム = MACD - シグナル線
  const histogram: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(macd[i]) || isNaN(paddedSignal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - paddedSignal[i]);
    }
  }
  
  return { macd, signal: paddedSignal, histogram };
};

/**
 * ボリンジャーバンドを計算する
 * @param prices 価格の配列
 * @param period 期間（通常20）
 * @param multiplier 標準偏差の乗数（通常2）
 * @returns {middle, upper, lower} 中央線、上限線、下限線の配列
 */
export const calculateBollingerBands = (
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): { middle: number[], upper: number[], lower: number[] } => {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }
    
    // 標準偏差を計算
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, price) => sum + price, 0) / period;
    const squaredDiffs = slice.map(price => Math.pow(price - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    upper.push(middle[i] + multiplier * stdDev);
    lower.push(middle[i] - multiplier * stdDev);
  }
  
  return { middle, upper, lower };
};

/**
 * OHLCデータから特定の値（始値、高値、安値、終値）の配列を抽出する
 * @param data OHLCデータの配列
 * @param key 抽出するプロパティ名
 * @returns 抽出した値の配列
 */
export const extractPrices = (
  data: OHLCData[],
  key: 'open' | 'high' | 'low' | 'close' = 'close'
): number[] => {
  return data.map(candle => candle[key]);
};

/**
 * タイムスタンプの重複を除去し、昇順にソートする
 * lightweight-charts の "data must be asc ordered by time" エラー防止
 * @param arr 時系列データの配列
 * @returns 重複除去・ソート済み配列
 */
export function dedupAndSort<T extends { time: UTCTimestamp | number }>(arr: T[]): T[] {
  if (!arr || !arr.length) return [];
  
  // timeを数値として扱うために変換を確実に行う
  const map = new Map<number, T>();
  for (const item of arr) {
    const timeKey = typeof item.time === 'number' ? item.time : Number(item.time);
    map.set(timeKey, item);
  }
  
  return Array.from(map.values())
    .sort((a, b) => {
      const timeA = typeof a.time === 'number' ? a.time : Number(a.time);
      const timeB = typeof b.time === 'number' ? b.time : Number(b.time);
      return timeA - timeB;
    });
}

/**
 * チャートシリーズを安全に削除する
 * 「Value is undefined」エラー防止
 * @param chart チャートインスタンス
 * @param series 削除対象のシリーズ
 */
export function safeRemoveSeries(
  chart: IChartApi | null,
  series: ISeriesApi<any> | null | undefined
): void {
  if (!chart || !series) return;
  
  try {
    chart.removeSeries(series);
  } catch (e) {
    console.warn('Series already removed or invalid', e);
  }
}

/**
 * タイムスタンプがミリ秒単位であることを確認し、必要に応じて変換する
 */
export function ensureMilliseconds(timestamp: number): number {
  if (timestamp === undefined || timestamp === null) {
    logger.warn('タイムスタンプが未定義です', {
      component: 'chartUtils',
      action: 'ensureMilliseconds'
    });
    return Date.now(); // 現在時刻をデフォルト値として使用
  }
  
  // Unix秒からミリ秒に変換（タイムスタンプが13桁未満の場合）
  if (timestamp > 0 && timestamp < 10000000000) {
    return timestamp * 1000;
  }
  
  return timestamp;
}

/**
 * タイムスタンプを読みやすい形式にフォーマットする
 * 改善版: 日本語ロケールを使用し、エラーハンドリングを強化
 */
export function formatTimestamp(timestamp: number): string {
  try {
    // タイムスタンプがミリ秒単位であることを確認
    const normalizedTimestamp = ensureMilliseconds(timestamp);
    
    // 日本語ロケールを使用して日付をフォーマット
    return format(new Date(normalizedTimestamp), 'yyyy/MM/dd HH:mm', { locale: ja });
  } catch (error) {
    logger.warn('タイムスタンプのフォーマットに失敗しました', {
      component: 'chartUtils',
      action: 'formatTimestamp',
      timestamp,
      error
    });
    return '無効な日付';
  }
}

/**
 * 日付を YYYY/MM/DD 形式にフォーマットする
 * @deprecated 代わりに formatTimestamp() を使用してください
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

/**
 * タイムフレームをミリ秒単位に変換する
 */
export function timeframeToMilliseconds(timeframe: Timeframe): number {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day; // 近似値

  switch (timeframe) {
    case '1m': return minute;
    case '3m': return 3 * minute;
    case '5m': return 5 * minute;
    case '15m': return 15 * minute;
    case '30m': return 30 * minute;
    case '1h': return hour;
    case '2h': return 2 * hour;
    case '4h': return 4 * hour;
    case '6h': return 6 * hour;
    case '8h': return 8 * hour;
    case '12h': return 12 * hour;
    case '1d': return day;
    case '3d': return 3 * day;
    case '1w': return week;
    case '1M': return month;
    default:
      logger.warn(`不明なタイムフレーム: ${timeframe}`, {
        component: 'chartUtils',
        action: 'timeframeToMilliseconds'
      });
      return hour; // デフォルト値として1時間を返す
  }
}

/**
 * 指定したタイムフレームに基づいて、日付をスナップする
 * （例: 1時間足なら、時間の始まりにスナップする）
 */
export function snapToTimeframe(date: Date, timeframe: Timeframe): Date {
  const result = new Date(date);
  
  switch (timeframe) {
    case '1m':
    case '3m':
    case '5m':
    case '15m':
    case '30m':
      // 分足の場合は、秒とミリ秒をリセット
      result.setSeconds(0, 0);
      break;
    case '1h':
    case '2h':
    case '4h':
    case '6h':
    case '8h':
    case '12h':
      // 時間足の場合は、分、秒、ミリ秒をリセット
      result.setMinutes(0, 0, 0);
      break;
    case '1d':
    case '3d':
      // 日足の場合は、時間、分、秒、ミリ秒をリセット
      result.setHours(0, 0, 0, 0);
      break;
    case '1w':
      // 週足の場合は、その週の始まり（日曜日）にスナップ
      const day = result.getDay();
      result.setDate(result.getDate() - day);
      result.setHours(0, 0, 0, 0);
      break;
    case '1M':
      // 月足の場合は、その月の1日にスナップ
      result.setDate(1);
      result.setHours(0, 0, 0, 0);
      break;
  }
  
  return result;
}

/**
 * 指定した時間が有効かどうかを検証する
 */
export function isValidTime(time: any): boolean {
  if (time === undefined || time === null) {
    return false;
  }
  
  if (typeof time === 'number') {
    return time > 0 && !isNaN(time);
  }
  
  if (typeof time === 'string') {
    const date = new Date(time);
    return !isNaN(date.getTime());
  }
  
  return false;
}

/**
 * 時間値を標準化して常に数値のミリ秒タイムスタンプに変換する
 */
export function normalizeTimeValue(time: any): number {
  if (!isValidTime(time)) {
    logger.warn('無効な時間値が渡されました。現在時刻を使用します', {
      component: 'chartUtils',
      action: 'normalizeTimeValue',
      time
    });
    return Date.now();
  }
  
  // 文字列の場合はDateオブジェクトに変換
  if (typeof time === 'string') {
    return new Date(time).getTime();
  }
  
  // 既に数値の場合はミリ秒単位であることを確認
  return ensureMilliseconds(time);
}
