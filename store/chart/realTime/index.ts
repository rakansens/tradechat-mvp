// store/chart/realTime/index.ts
// 作成: RealTimeSliceの統合とエクスポート

import { RealTimeSliceState, initialRealTimeState } from './state'
import { RealTimeActions, RealTimeSlice, createRealTimeActions } from './actions'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * RealTimeSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createRealTimeSlice = <T extends RealTimeSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): RealTimeSlice => {
  return {
    // 初期状態
    ...initialRealTimeState,
    
    // アクション
    ...createRealTimeActions(set, get)
  }
}

/**
 * RealTimeSliceを使用したスタンドアロンストア
 * このストアは移行期間中に使用され、最終的にはrootStoreに統合されます
 * @deprecated 代わりにrootStoreのRealTimeSliceを使用してください
 */
export const useRealTimeStore = create<RealTimeSlice>()(
  devtools(
    persist(
      (set, get) => createRealTimeSlice(set, get),
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
export type { RealTimeSlice, RealTimeActions, RealTimeSliceState } 