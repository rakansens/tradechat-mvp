// utils/chartUtils.ts
// 作成: チャート関連のユーティリティ関数を統合
// 
// このファイルは以下のチャート関連の機能を提供します:
// - タイムフレーム関連の計算
// - テクニカル指標の計算（SMA, EMA, RSI, MACD, ボリンジャーバンド）
// - チャートデータの処理と変換

import type { Timeframe, OHLCData } from "@/types/chart";

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
