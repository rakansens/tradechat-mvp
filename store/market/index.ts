// store/market/index.ts
// 初期実装: マーケットスライスのエントリーポイント

import { MarketSliceState, initialMarketState } from './state'
import { MarketSliceActions, createMarketActions } from './actions'

// マーケットスライスの完全な型
export type MarketSlice = MarketSliceState & MarketSliceActions

// マーケットスライスの作成関数
export const createMarketSlice = (
  set: (fn: (state: MarketSliceState) => void) => void,
  get: () => MarketSliceState
): MarketSlice => {
  // アクションを作成
  const actions = createMarketActions(set, get)

  // 状態とアクションを組み合わせたスライスを返す
  return {
    ...initialMarketState,
    ...actions
  }
}

// メモ化されたセレクターのエクスポート
export * from './selectors' 