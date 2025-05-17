// store/chart/realTime/index.ts
// 作成: RealTimeSliceの統合とエクスポート
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import { initialRealTimeState } from './state'
import { createRealTimeActions } from './actions'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { type RealTimeSlice, type RealTimeSliceState, type RealTimeSliceActions, type RealTimeSliceCreator } from './types'
import { createSlice } from '@/store/core/createSlice'
import { createImmerSetter } from '@/store/core/immerSet'

/**
 * RealTimeSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createRealTimeSlice: RealTimeSliceCreator =
  createSlice<RealTimeSlice, RealTimeSliceState>((set, get, api) => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<RealTimeSliceState>(set)
  
  // 型安全なゲッター関数
  const getState = () => get() as RealTimeSlice
  
  // アクションを作成
  const actions = createRealTimeActions(
    immerSet,
    getState
  )
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態
    ...initialRealTimeState,
    
    // アクション
    ...actions
  }
})

/**
 * RealTimeSliceを使用したスタンドアロンストア
 * このストアは移行期間中に使用され、最終的にはrootStoreに統合されます
 * @deprecated 代わりにrootStoreのRealTimeSliceを使用してください
 */
export const useRealTimeStore = create<RealTimeSlice>()(
  devtools(
    persist(
      immer((set, get) => createRealTimeSlice(set, get)),
      {
        name: "real-time-storage",
        partialize: (state: RealTimeSlice) => ({
          // 永続化する状態のみを選択
          useRealTimeData: state.useRealTimeData
        }),
      }
    ),
    { name: "real-time-store" }
  )
)

// 型をエクスポート
export type { RealTimeSlice, RealTimeSliceState, RealTimeSliceActions } from './types' 