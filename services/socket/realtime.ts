// services/socket/realtime.ts
// 作成: リアルタイム更新のためのWebSocket関連機能を提供するサービス層

import SocketService from "./socket-service";
import { WebSocketClient } from "./websocket-client";
import { SubscriptionManager } from "./subscription-manager";
import { BitgetIntegration } from "./bitget-integration";
import { toProductType } from "@/utils/exchangeTypeUtils";

// SocketServiceのインスタンスを作成
const webSocketClient = new WebSocketClient();
const subscriptionManager = new SubscriptionManager();
const bitgetIntegration = new BitgetIntegration();
const socketService = new SocketService(webSocketClient, subscriptionManager, bitgetIntegration);

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
  if (!socketService) {
    console.error('SocketService not initialized');
    return;
  }
  
  // WebSocketでKlineを購読
  if (typeof socketService.subscribeKline === 'function') {
    socketService.subscribeKline(s, tf, cb, toProductType('bitget'));
  } else {
    console.error('subscribeKline method not available');
  }
}

/**
 * すべての購読を解除する関数
 */
export const unsubscribeAll = () => {
  if (socketService && typeof socketService.disconnectAll === 'function') {
    socketService.disconnectAll();
  }
};