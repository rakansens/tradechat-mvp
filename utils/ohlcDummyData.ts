// Added deterministic pseudoRandom function to ensure consistent OHLC dummy data across server and client and avoid hydration mismatch.
// Timeframe型のインポートを追加
import type { Timeframe } from "@/types"

// Deterministic pseudo-random number generator based on index
// Returns a float in [0, 1)
const pseudoRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate realistic-looking OHLC data for different timeframes
export function generateOHLCData(count: number, timeframe: Timeframe = "1d") {
  const data = []
  let currentPrice = 60000 // Starting price

  // 時間枠に基づいてボラティリティを調整
  const volatilityMap: Record<Timeframe, number> = {
    "1m": 0.002,
    "5m": 0.005,
    "15m": 0.008,
    "1h": 0.01,
    "4h": 0.015,
    "1d": 0.02,
  }

  const volatility = volatilityMap[timeframe]
  const now = new Date()

  // 時間枠に基づいて時間間隔を設定（ミリ秒単位）
  const timeIntervalMap: Record<Timeframe, number> = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  }

  const timeInterval = timeIntervalMap[timeframe]

  for (let i = count; i >= 0; i--) {
    const date = new Date(now.getTime() - i * timeInterval)

    // Deterministic pseudo-random price movement with some trend
    const changePercent = (pseudoRandom(i + 1) - 0.5) * volatility * 2
    const change = currentPrice * changePercent

    // More realistic OHLC data generation
    const open = currentPrice

    // Generate intraday volatility
    const highChange = Math.abs(pseudoRandom(i + 2) * volatility * currentPrice)
    const lowChange = Math.abs(pseudoRandom(i + 3) * volatility * currentPrice)

    const close = open + change
    const high = Math.max(open, close) + highChange
    const low = Math.min(open, close) - lowChange

    // ボリュームも時間枠に応じて調整
    const volumeBase = timeframe === "1d" ? 10000 : timeframe === "4h" ? 5000 : timeframe === "1h" ? 2000 : 1000

    data.push({
      time: date.getTime(), // ISO文字列ではなくUNIXタイムスタンプ（ミリ秒）を使用
      open,
      high,
      low,
      close,
      volume: Math.floor(pseudoRandom(i + 4) * volumeBase) + volumeBase / 2,
    })

    currentPrice = close
  }

  return data
}

// 時間枠に基づいて表示名を取得
export function getTimeframeDisplayName(timeframe: Timeframe): string {
  const displayNames: Record<Timeframe, string> = {
    "1m": "1分足",
    "5m": "5分足",
    "15m": "15分足",
    "1h": "1時間足",
    "4h": "4時間足",
    "1d": "日足",
  }

  return displayNames[timeframe]
}
