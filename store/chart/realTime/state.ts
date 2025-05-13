// store/chart/realTime/state.ts
// 作成: RealTimeSliceの状態定義

import type { BitgetApiClient } from "@/services/api/bitget/client"
import type { ExchangeType } from "@/types/api"

/**
 * リアルタイム更新スライスの状態型定義
 */
export interface RealTimeSliceState {
  // リアルタイムデータ更新の有効/無効設定
  useRealTimeData: boolean
  
  // WebSocket APIクライアント
  bitgetApi: BitgetApiClient | null
  
  // 最後に購読したキー
  lastSubscriptionKey: string
}

/**
 * リアルタイム更新スライスの初期状態
 */
export const initialRealTimeState: RealTimeSliceState = {
  useRealTimeData: true,
  bitgetApi: null,
  lastSubscriptionKey: ""
} 