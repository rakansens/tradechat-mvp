// store/chart/indicator/selectors.ts
// 作成: IndicatorSliceのセレクター定義

import { createSelector } from 'reselect'
import type { IndicatorType } from '@/types/store'
import type { IndicatorSlice } from './actions'

/**
 * アクティブなインジケーターを選択するセレクター
 */
export const selectActiveIndicators = (state: IndicatorSlice) => state.activeIndicators

/**
 * 特定のインジケーターのパラメーターを選択するセレクター
 */
export const selectIndicatorParams = createSelector(
  [selectActiveIndicators, (_: IndicatorSlice, indicator: IndicatorType) => indicator],
  (indicators, indicator) => {
    const found = indicators.find(item => item.type === indicator)
    return found?.params || null
  }
)

/**
 * インジケーターが有効かどうかを判定するセレクター
 */
export const selectIsIndicatorActive = createSelector(
  [selectActiveIndicators, (_: IndicatorSlice, indicator: IndicatorType) => indicator],
  (indicators, indicator) => indicators.some(item => item.type === indicator)
) 