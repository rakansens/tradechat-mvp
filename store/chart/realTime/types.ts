// store/chart/realTime/types.ts
// 作成: 2025-10-06 - RealTimeSliceのState, Actions, Slice型を定義

import type { ExchangeType } from '@/types/constants/enums';
import type { BitgetApiClient } from '@/services/api/bitget/client';
import { type SliceCreator } from '@/types/store/core';

/**
 * リアルタイムスライスの状態型定義
 */
export interface RealTimeSliceState {
  // リアルタイム更新が有効かどうか
  useRealTimeData: boolean;
  
  // リアルタイム更新のタイマーID
  timer: NodeJS.Timeout | null;
  
  // カスタムイベントハンドラーの登録リスト
  eventHandlers: Record<string, Function[]>;
  
  // WebSocketの接続状態
  connected: boolean;
  
  // Bitget API クライアント
  bitgetApi: BitgetApiClient | null;
  
  // 最後に購読したキー
  lastSubscriptionKey: string | null;
}

/**
 * リアルタイムスライスのアクション型定義
 */
export interface RealTimeSliceActions {
  // リアルタイム更新を開始するアクション
  startRealTimeUpdates: () => void;
  
  // リアルタイム更新を停止するアクション
  stopRealTimeUpdates: () => void;
  
  // リアルタイム更新の有効/無効を切り替えるアクション
  toggleRealTimeData: () => void;
  
  // Bitget APIクライアントを初期化するアクション
  initializeApi: (exchangeType: ExchangeType) => void;
}

/**
 * リアルタイムスライスの完全な型定義（状態+アクション）
 */
export type RealTimeSlice = RealTimeSliceState & RealTimeSliceActions;

/**
 * スライスクリエーター型定義
 */
export type RealTimeSliceCreator = SliceCreator<RealTimeSlice, RealTimeSliceState>; 