// services/socket/realtime.ts
// 作成: リアルタイム更新のためのWebSocket関連機能を提供するサービス層

import { socketService } from "./socket-service";
import type { Timeframe, OHLCData } from "@/types/chart";

/**
 * 購読キーの型定義
 */
export type SubscriptionKey = `${string}:${Timeframe}`;

/**
 * 購読キーを生成する関数
 */
export const key = (s: string, tf: Timeframe): SubscriptionKey => `${s}:${tf}`;

/**
 * Kラインデータを購読する関数
 * @param s シンボル名（例: "BTC/USD"）
 * @param tf タイムフレーム（例: "1m", "1h"）
 * @param cb データ受信時のコールバック関数
 */
export function subscribeKline(s: string, tf: Timeframe, cb: (d: OHLCData) => void) {
  const api = socketService.current();
  
  if (!api) {
    console.error('Socket API client not initialized');
    return;
  }
  
  // WebSocketでKlineを購読
  if (typeof api.subscribeToKline === 'function') {
    api.subscribeToKline(s, tf);
  } else {
    console.error('subscribeToKline method not available');
    return;
  }
  
  // データ受信時のコールバックを設定
  if (typeof api.onKlineUpdate === 'function') {
    api.onKlineUpdate(cb);
  } else {
    console.error('onKlineUpdate method not available');
  }
}

/**
 * すべての購読を解除する関数
 */
export const unsubscribeAll = () => {
  const api = socketService.current();
  if (api && typeof api.disconnectWebSocket === 'function') {
    api.disconnectWebSocket();
  }
}; 