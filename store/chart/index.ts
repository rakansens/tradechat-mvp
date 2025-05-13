// store/chart/index.ts
// 初期実装: チャートスライスのエントリーポイント

import { ChartSliceState, initialChartState } from './state'
import { ChartSliceActions, createChartActions } from './actions'

// チャートスライスの完全な型
export type ChartSlice = ChartSliceState & ChartSliceActions

// チャートスライスの作成関数
export const createChartSlice = (
  set: (fn: (state: ChartSliceState) => void) => void,
  get: () => ChartSliceState
): ChartSlice => {
  // アクションを作成
  const actions = createChartActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialChartState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors'
