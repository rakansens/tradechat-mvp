// store/chart/realTime/state.ts
// 作成: RealTimeSliceの状態定義
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、状態構造を更新
// 更新: 2025-10-10 - 状態型をエクスポートして型参照問題を解消

import { type RealTimeSliceState } from './types';

/**
 * リアルタイム更新スライスの初期状態
 */
export const initialRealTimeState: RealTimeSliceState = {
  // リアルタイム設定
  useRealTimeData: true,
  
  // タイマー
  timer: null,
  
  // イベントハンドラー
  eventHandlers: {},
  
  
  // 接続状態
  connected: false,
  
  // Bitget API クライアント
  bitgetApi: null,
  
  // 最後に購読したキー
  lastSubscriptionKey: null
}; 

// リアルタイムスライスの状態型を再エクスポート（型参照問題解消のため）
export type { RealTimeSliceState }; 