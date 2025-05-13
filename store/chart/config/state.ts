// store/chart/config/state.ts
// 作成: ChartConfigSliceの状態定義

import type { ChartType } from "@/types/chart"
import { ExchangeType } from "@/types/api"

/**
 * チャート設定スライスの状態型定義
 */
export interface ChartConfigSliceState {
  chartType: ChartType
  exchangeType: ExchangeType
}

/**
 * チャート設定スライスの初期状態
 */
export const initialChartConfigState: ChartConfigSliceState = {
  chartType: "candles", // デフォルトはローソク足チャート
  exchangeType: "spot"  // デフォルトは現物取引
} 