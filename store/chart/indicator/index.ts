// store/chart/indicator/index.ts
// 作成: IndicatorSliceの統合とエクスポート

import { IndicatorSliceState, initialIndicatorState } from './state'
import { IndicatorActions, IndicatorSlice, createIndicatorActions } from './actions'

/**
 * IndicatorSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createIndicatorSlice = <T extends IndicatorSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): IndicatorSlice => {
  return {
    // 初期状態
    ...initialIndicatorState,
    
    // アクション
    ...createIndicatorActions(set, get)
  }
}

// 型をエクスポート
export type { IndicatorSlice, IndicatorActions, IndicatorSliceState } 