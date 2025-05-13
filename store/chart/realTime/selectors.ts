// store/chart/realTime/selectors.ts
// 作成: RealTimeSliceのセレクター

import { createSelector } from 'reselect'
import type { RealTimeSliceState } from './state'

/**
 * リアルタイムデータ更新の有効/無効状態を選択するセレクター
 */
export const selectUseRealTimeData = (state: RealTimeSliceState) => state.useRealTimeData

/**
 * APIクライアントを選択するセレクター
 */
export const selectBitgetApi = (state: RealTimeSliceState) => state.bitgetApi

/**
 * WebSocket購読が利用可能かどうかを判定するメモ化されたセレクター
 * APIクライアントが初期化されていて、リアルタイムデータが有効な場合にtrueを返します
 */
export const selectIsWebSocketEnabled = createSelector(
  [selectUseRealTimeData, selectBitgetApi],
  (useRealTimeData, bitgetApi) => useRealTimeData && bitgetApi !== null
)

/**
 * 最後に購読したキーを選択するセレクター
 */
export const selectLastSubscriptionKey = (state: RealTimeSliceState) => state.lastSubscriptionKey 