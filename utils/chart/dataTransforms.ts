// utils/chart/dataTransforms.ts
// 作成: チャートデータの変換ロジックを担当するユーティリティ関数
// 関数が単一責任を持つようにリファクタリング

import { ChartCandle, ChartLineData } from '@/types/chartModels'
import { CandleData } from '@/types/api'

/**
 * APIレスポンスの生データをチャート表示用のフォーマットに変換
 */
export function transformCandleData(data: CandleData[]): ChartCandle[] {
  if (!data || !Array.isArray(data)) return []
  
  return data.map((candle) => ({
    time: candle.timestamp / 1000, // Unix timestamp in seconds
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume
  }))
}

/**
 * 移動平均線データを計算する
 */
export function calculateMA(data: ChartCandle[], period: number): ChartLineData[] {
  if (!data || data.length < period) return []
  
  const result: ChartLineData[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({
      time: data[i].time,
      value: sum / period
    })
  }
  
  return result
}

/**
 * ボリンジャーバンドを計算する
 */
export function calculateBollingerBands(
  data: ChartCandle[], 
  period: number = 20, 
  multiplier: number = 2
): { upper: ChartLineData[], middle: ChartLineData[], lower: ChartLineData[] } {
  if (!data || data.length < period) {
    return { upper: [], middle: [], lower: [] }
  }
  
  const middle = calculateMA(data, period)
  const upper: ChartLineData[] = []
  const lower: ChartLineData[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - middle[i - (period - 1)].value
      sum += diff * diff
    }
    const stdDev = Math.sqrt(sum / period)
    
    upper.push({
      time: data[i].time,
      value: middle[i - (period - 1)].value + multiplier * stdDev
    })
    
    lower.push({
      time: data[i].time,
      value: middle[i - (period - 1)].value - multiplier * stdDev
    })
  }
  
  return { upper, middle, lower }
}

/**
 * RSI（相対力指数）を計算する
 */
export function calculateRSI(data: ChartCandle[], period: number = 14): ChartLineData[] {
  if (!data || data.length <= period) return []
  
  const result: ChartLineData[] = []
  let gains = 0
  let losses = 0
  
  // 初期値を計算
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close
    if (change >= 0) {
      gains += change
    } else {
      losses -= change
    }
  }
  
  // 最初のRSI値を計算
  let avgGain = gains / period
  let avgLoss = losses / period
  let rs = avgGain / avgLoss
  let rsi = 100 - (100 / (1 + rs))
  
  result.push({
    time: data[period].time,
    value: rsi
  })
  
  // 残りのRSI値を計算
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close
    if (change >= 0) {
      avgGain = ((avgGain * (period - 1)) + change) / period
      avgLoss = (avgLoss * (period - 1)) / period
    } else {
      avgGain = (avgGain * (period - 1)) / period
      avgLoss = ((avgLoss * (period - 1)) - change) / period
    }
    
    rs = avgGain / avgLoss
    rsi = 100 - (100 / (1 + rs))
    
    result.push({
      time: data[i].time,
      value: rsi
    })
  }
  
  return result
}

/**
 * MACDを計算する
 */
export function calculateMACD(
  data: ChartCandle[], 
  fastPeriod: number = 12, 
  slowPeriod: number = 26, 
  signalPeriod: number = 9
): { macd: ChartLineData[], signal: ChartLineData[], histogram: ChartLineData[] } {
  if (!data || data.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
    return { macd: [], signal: [], histogram: [] }
  }
  
  // EMAを計算する内部関数
  function calculateEMA(data: ChartCandle[], period: number): ChartLineData[] {
    const k = 2 / (period + 1)
    const emaResult: ChartLineData[] = []
    
    // 最初のEMAは単純移動平均
    let sum = 0
    for (let i = 0; i < period; i++) {
      sum += data[i].close
    }
    
    let ema = sum / period
    emaResult.push({
      time: data[period - 1].time,
      value: ema
    })
    
    // 残りのEMAを計算
    for (let i = period; i < data.length; i++) {
      ema = (data[i].close - ema) * k + ema
      emaResult.push({
        time: data[i].time,
        value: ema
      })
    }
    
    return emaResult
  }
  
  // 高速EMAと低速EMAを計算
  const fastEMA = calculateEMA(data, fastPeriod)
  const slowEMA = calculateEMA(data, slowPeriod)
  
  // MACDラインを計算
  const macdLine: ChartLineData[] = []
  const start = slowPeriod - fastPeriod
  
  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push({
      time: slowEMA[i].time,
      value: fastEMA[i + start].value - slowEMA[i].value
    })
  }
  
  // シグナルラインを計算（MACDのEMA）
  let sum = 0
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdLine[i].value
  }
  
  const k = 2 / (signalPeriod + 1)
  let signalEMA = sum / signalPeriod
  
  const signalLine: ChartLineData[] = []
  signalLine.push({
    time: macdLine[signalPeriod - 1].time,
    value: signalEMA
  })
  
  // 残りのシグナルラインを計算
  for (let i = signalPeriod; i < macdLine.length; i++) {
    signalEMA = (macdLine[i].value - signalEMA) * k + signalEMA
    signalLine.push({
      time: macdLine[i].time,
      value: signalEMA
    })
  }
  
  // ヒストグラムを計算（MACD - シグナル）
  const histogram: ChartLineData[] = []
  const start2 = macdLine.length - signalLine.length
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push({
      time: signalLine[i].time,
      value: macdLine[i + start2].value - signalLine[i].value
    })
  }
  
  return {
    macd: macdLine.slice(start2),
    signal: signalLine,
    histogram
  }
} 