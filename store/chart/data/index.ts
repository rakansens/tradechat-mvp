// store/chart/data/index.ts
// 作成: ChartDataSliceの統合とエクスポート
// 更新: 2025-10-04 - スライスの型定義をtypes.tsに移動、State & Actions型を使用

import { initialChartDataState } from './state'
import { createChartDataActions } from './actions'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ChartDataSlice, ChartDataSliceState, ChartDataSliceActions } from './types'
import { type SliceCreator } from '@/types/store/core'
import { createSlice } from '@/store/core/createSlice'

/**
 * ChartDataSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createChartDataSlice: SliceCreator<ChartDataSlice, ChartDataSliceState> =
  createSlice<ChartDataSlice, ChartDataSliceState>((set, get, api) => {
    const setPartial = (partial: Partial<ChartDataSliceState>) => {
      set(state => {
        Object.assign(state, partial)
      })
    }

    const getState = () => get() as ChartDataSlice

    const actions = createChartDataActions(setPartial, getState)

    return {
      ...initialChartDataState,
      ...actions
    }
  })

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
export type { ChartDataSlice, ChartDataSliceState, ChartDataSliceActions } from './types' 