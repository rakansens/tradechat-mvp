// store/chart/config/selectors.ts
// 作成: ChartConfigSliceのセレクター定義
// 更新: 2025-10-08 - S-5フェーズ: 型参照パスを修正
// 更新: 2025-05-17 - ChartTypeの統一: 'candlestick'を'candles'に変更

import { createSelector } from 'reselect'
import type { ChartConfigSlice } from './types'

/**
 * チャートタイプを選択するセレクター
 */
export const selectChartType = (state: ChartConfigSlice) => state.chartType

/**
 * 取引タイプを選択するセレクター
 */
export const selectExchangeType = (state: ChartConfigSlice) => state.exchangeType

/**
 * キャンドルチャートかどうかを判定するメモ化セレクター
 */
export const selectIsCandleChart = createSelector(
  [selectChartType],
  (chartType) => chartType === 'candles'
)