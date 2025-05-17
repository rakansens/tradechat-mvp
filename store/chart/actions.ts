// store/chart/actions.ts
// 初期実装: チャートスライスのアクション

import type { ChartType, Timeframe } from "@/types/chart"
import { ChartSliceState, getDataPointsForTimeframe } from "./state"
import { generateOHLCData } from "@/utils/ohlcDummyData"

// チャートスライスのアクション定義
export interface ChartSliceActions {
  // タイムフレーム変更アクション
  setTimeframe: (timeframe: Timeframe) => void
  
  // チャートタイプ変更アクション
  setChartType: (chartType: ChartType) => void
  
  // OHLCデータ再生成アクション
  refreshOhlcData: () => void
}

// チャートスライスのアクション作成関数
export const createChartActions = (
  set: (fn: (state: ChartSliceState) => void) => void,
  get: () => ChartSliceState
): ChartSliceActions => ({
  
  // タイムフレーム変更アクション
  setTimeframe: (timeframe: Timeframe) => {
    const dataPoints = getDataPointsForTimeframe(timeframe)
    set((state) => {
      state.timeframe = timeframe
      state.ohlcData = generateOHLCData(dataPoints, timeframe)
    })
  },
  
  // チャートタイプ変更アクション
  setChartType: (chartType: ChartType) => {
    set((state) => {
      state.chartType = chartType
    })
  },
  
  // OHLCデータ再生成アクション
  refreshOhlcData: () => {
    const { timeframe } = get()
    const dataPoints = getDataPointsForTimeframe(timeframe)
    set((state) => {
      state.ohlcData = generateOHLCData(dataPoints, timeframe)
    })
  }
}) 