// store/chart/config/selectors.ts
// 作成: ChartConfigSliceのセレクター定義

import { createSelector } from 'reselect'
import type { ChartConfigSlice } from './actions'

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