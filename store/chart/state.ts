// store/chart/state.ts
// 初期実装: チャートスライスの状態とデフォルト値

import type { OHLCData, Timeframe, ChartType } from "@/types/chart"
import { generateOHLCData } from "@/utils/ohlcDummyData"

// チャートスライスの状態定義
export interface ChartSliceState {
  timeframe: Timeframe
  chartType: ChartType
  ohlcData: OHLCData[]
}

// 初期タイムフレーム
export const DEFAULT_TIMEFRAME: Timeframe = "1d"

// タイムフレームごとのデータポイント数を決定するヘルパー関数
export function getDataPointsForTimeframe(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1m":
      return 60 * 24 // 1 day of minute data
    case "5m":
      return 12 * 24 // 1 day of 5-minute data
    case "15m":
      return 4 * 24 // 1 day of 15-minute data
    case "1h":
      return 24 * 7 // 1 week of hourly data
    case "4h":
      return 6 * 7 // 1 week of 4-hour data
    case "1d":
      return 30 // 1 month of daily data
    default:
      return 100
  }
}

// チャートスライスの初期状態
export const initialChartState: ChartSliceState = {
  timeframe: DEFAULT_TIMEFRAME,
  chartType: "candles",
  ohlcData: generateOHLCData(getDataPointsForTimeframe(DEFAULT_TIMEFRAME), DEFAULT_TIMEFRAME),
} 