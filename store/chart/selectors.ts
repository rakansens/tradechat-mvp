// store/chart/selectors.ts
// 初期実装: チャートスライスのセレクター

import { createMemoSelector } from "@/store/core/selectors"
import type { RootStore } from "@/store/rootStore"
import type { OHLCData } from "@/types/chart"
import type { ChartType, Timeframe } from "@/types/constants/enums"

// チャートスライスの各状態セレクター
export const selectTimeframe = createMemoSelector<RootStore, Timeframe>(
  (state) => state.timeframe
)

export const selectChartType = createMemoSelector<RootStore, ChartType>(
  (state) => state.chartType
)

export const selectOHLCData = createMemoSelector<RootStore, OHLCData[]>(
  (state) => state.ohlcData
)

// 最新価格を取得するセレクター
export const selectCurrentPrice = createMemoSelector<RootStore, number | null>(
  (state) => {
    const ohlcData = state.ohlcData
    if (ohlcData && ohlcData.length > 0) {
      return ohlcData[ohlcData.length - 1].close
    }
    return null
  }
)

// 価格変動率を計算するセレクター
export const selectPriceChangePercent = createMemoSelector<RootStore, number | null>(
  (state) => {
    const ohlcData = state.ohlcData
    if (ohlcData && ohlcData.length >= 2) {
      const current = ohlcData[ohlcData.length - 1].close
      const previous = ohlcData[ohlcData.length - 2].close
      return ((current - previous) / previous) * 100
    }
    return null
  }
) 