// store/chart/indicator/selectors.ts
// 作成: IndicatorSliceのセレクター定義
// 更新: 2025-10-08 - S-5フェーズ: 型参照パスを修正、不要なセレクターを削除

import { createSelector } from 'reselect'
import type { IndicatorType } from '@/types/store/chart'
import type { IndicatorSlice } from './types'

/**
 * アクティブなインジケーターを選択するセレクター
 */
export const selectActiveIndicators = (state: IndicatorSlice) => state.activeIndicators

/**
 * インジケーターが有効かどうかを判定するセレクター
 */
export const selectIsIndicatorActive = createSelector(
  [selectActiveIndicators, (_: IndicatorSlice, indicator: IndicatorType) => indicator],
  (indicators, indicator) => indicators.includes(indicator)
) 