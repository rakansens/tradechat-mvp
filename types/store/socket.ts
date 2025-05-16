// types/store/socket.ts
// 作成: 2025-10-07 - ソケットストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/socket/state.tsの定義を統合

import { WebSocketSubscription } from '@/types/network/websocket';
import { ExchangeType } from '@/types/api';

/**
 * このファイルはWebSocket接続ストアの型定義を提供します。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

// 外部から使われる可能性のある型を再エクスポート
export type { WebSocketSubscription };

// WebSocketの接続状態
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// ソケットスライスの状態インターフェース
export interface SocketState {
  /**
   * ソケットの接続状態
   * true: 接続済み, false: 切断
   */
  connected: boolean;
  
  /**
   * ソケットID
   * 接続時に割り当てられるユニークID
   */
  socketId?: string;

  /**
   * 購読状態の管理
   * 各チャンネルの購読状態をboolean値で管理
   */
  subscriptions: Record<'orderbook' | 'chart', boolean>;

  /**
   * 購読解除関数
   * キー: サブスクリプションID, 値: 購読解除関数
   * @private 内部実装用
   */
  _unsubscribeFns: Record<string, () => void>;

  // WebSocketの接続情報
  connection: SocketConnectionInfo;
  
  // 各種設定
  config: {
    url: string;
    reconnect: ReconnectionConfig;
    debug: boolean;
  };
  
  // メッセージキュー
  messageQueue: any[];
}

// WebSocketの接続情報
export interface SocketConnectionInfo {
  status: ConnectionStatus;
  lastConnected: number | null;
  error: string | null;
  reconnectAttempts: number;
}

// アクティブなサブスクリプションの状態
export interface ActiveSubscription extends WebSocketSubscription {
  active: boolean;
  lastMessageTime: number | null;
  errorCount: number;
}

// 再接続設定
export interface ReconnectionConfig {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

// ソケットスライスのアクション定義
export interface SocketActions {
  // 接続管理
  connect: () => void;
  disconnect: () => void;
  
  // 購読管理
  subscribe: (subscription: WebSocketSubscription) => void;
  unsubscribe: (subscription: WebSocketSubscription) => void;
  unsubscribeAll: () => void;
  
  // 接続状態管理
  setConnected: (connected: boolean) => void;
  setSocketId: (id: string) => void;
  setSubscription: (channel: 'orderbook' | 'chart', isSubscribed: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus, error?: string) => void;
  
  // 内部管理用
  getWebSocketStatus: () => { connected: boolean, subscriptions: Record<string, boolean> };
  
  // メッセージキュー管理
  clearMessageQueue: () => void;
  
  // 設定管理
  setConfig: (config: Partial<SocketState['config']>) => void;
}

// 完全なソケットスライスの型定義
export type SocketSlice = SocketState & SocketActions;

// サブスクリプション一意キーの生成関数
export const getSubscriptionKey = (
  channel: string,
  symbol: string,
  timeframe: string | null,
  exchangeType: ExchangeType
): string => {
  return `${channel}:${symbol}:${timeframe || 'none'}:${exchangeType}`;
}; 