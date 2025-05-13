// store/chart/data/index.ts
// 作成: ChartDataSliceの統合とエクスポート

import { ChartDataSliceState, initialChartDataState } from './state'
import { ChartDataActions, ChartDataSlice, createChartDataActions } from './actions'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * ChartDataSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createChartDataSlice = <T extends ChartDataSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): ChartDataSlice => {
  return {
    // 初期状態
    ...initialChartDataState,
    
    // アクション
    ...createChartDataActions(set, get)
  }
}

/**
 * ChartDataSliceを使用したスタンドアロンストア
 * このストアは移行期間中に使用され、最終的にはrootStoreに統合されます
 * @deprecated 代わりにrootStoreのChartDataSliceを使用してください
 */
export const useChartDataStore = create<ChartDataSlice>()(
  devtools(
    (set, get) => createChartDataSlice(set, get),
    { name: "chart-data-store" }
  )
)

// 型をエクスポート
export type { ChartDataSlice, ChartDataActions, ChartDataSliceState } 