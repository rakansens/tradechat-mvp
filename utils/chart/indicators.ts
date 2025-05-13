// utils/indicators.ts
// 作成: テクニカル指標関連のユーティリティ関数

import type { OHLCData } from "@/types/chart";

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
  const multiplier = 2 / (period + 1);
  
  // 最初のEMAは単純移動平均（SMA）として計算
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
    
    // EMA = 前日のEMA + (今日の価格 - 前日のEMA) * 乗数
    ema = (prices[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
};

/**
 * 相対力指数（RSI）を計算する
 * @param prices 価格の配列
 * @param period 期間（通常は14）
 * @returns RSI値の配列（0-100の範囲）
 */
export const calculateRSI = (prices: number[], period: number = 14): number[] => {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // 価格変化を計算
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
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
      result.push(100); // 下落がない場合はRSI = 100
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      result.push(rsi);
    }
  }
  
  return result;
};

/**
 * ボリンジャーバンドを計算する
 * @param prices 価格の配列
 * @param period 期間（通常は20）
 * @param multiplier 標準偏差の乗数（通常は2）
 * @returns ボリンジャーバンド（上限、中央、下限）の配列
 */
export const calculateBollingerBands = (
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): { upper: number[]; middle: number[]; lower: number[] } => {
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
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(prices[i - j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sum / period);
    
    upper.push(middle[i] + multiplier * stdDev);
    lower.push(middle[i] - multiplier * stdDev);
  }
  
  return { upper, middle, lower };
};

/**
 * MACD（Moving Average Convergence Divergence）を計算する
 * @param prices 価格の配列
 * @param fastPeriod 短期EMAの期間（通常は12）
 * @param slowPeriod 長期EMAの期間（通常は26）
 * @param signalPeriod シグナルラインの期間（通常は9）
 * @returns MACD、シグナル、ヒストグラムの配列
 */
export const calculateMACD = (
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } => {
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
  
  // シグナルライン = MACDのEMA
  const signal = calculateEMA(macd.filter(val => !isNaN(val)), signalPeriod);
  
  // シグナルラインの長さをMACDラインに合わせる
  const paddedSignal: number[] = [];
  for (let i = 0; i < macd.length - signal.length; i++) {
    paddedSignal.push(NaN);
  }
  paddedSignal.push(...signal);
  
  // ヒストグラム = MACD - シグナル
  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(paddedSignal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - paddedSignal[i]);
    }
  }
  
  return { macd, signal: paddedSignal, histogram };
};

/**
 * OHLCデータから指定された指標を計算する
 * @param data OHLCデータの配列
 * @param indicator 指標の種類
 * @param params 指標のパラメータ
 * @returns 計算された指標の値
 */
export const calculateIndicator = (
  data: OHLCData[],
  indicator: string,
  params: Record<string, number> = {}
): any => {
  // 終値の配列を取得
  const closes = data.map(item => item.close);
  
  switch (indicator) {
    case "sma":
      return calculateSMA(closes, params.period || 20);
    case "ema":
      return calculateEMA(closes, params.period || 20);
    case "rsi":
      return calculateRSI(closes, params.period || 14);
    case "bollinger":
      return calculateBollingerBands(closes, params.period || 20, params.multiplier || 2);
    case "macd":
      return calculateMACD(
        closes,
        params.fastPeriod || 12,
        params.slowPeriod || 26,
        params.signalPeriod || 9
      );
    default:
      return null;
  }
};
