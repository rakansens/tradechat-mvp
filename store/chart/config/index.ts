// store/chart/config/index.ts
// 作成: ChartConfigSliceの統合とエクスポート

import { ChartConfigSliceState, initialChartConfigState } from './state'
import { ChartConfigActions, ChartConfigSlice, createChartConfigActions } from './actions'

/**
 * ChartConfigSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createChartConfigSlice = <T extends ChartConfigSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): ChartConfigSlice => {
  return {
    // 初期状態
    ...initialChartConfigState,
    
    // アクション
    ...createChartConfigActions(set, get)
  }
}

// 型をエクスポート
export type { ChartConfigSlice, ChartConfigActions, ChartConfigSliceState } 