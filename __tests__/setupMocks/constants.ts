/**
 * テスト用の定数値
 * WebSocketやその他のモック用定数を定義
 */

// WebSocketの接続状態を表す定数
export const WebSocketReadyState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
} as const;

export type WebSocketReadyState = typeof WebSocketReadyState[keyof typeof WebSocketReadyState]; 