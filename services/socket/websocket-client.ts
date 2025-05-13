/**
 * services/socket/websocket-client.ts
 * WebSocket接続管理を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 更新: 2025-05-13 - client.tsの新しいシングルトン方式を使用
 */

import { Socket } from 'socket.io-client';
import { initializeSocketClient, getSocket, disconnectSocket } from '../socket/client';
import { logger } from '../../utils/logger';
import { IWebSocketClient } from './interfaces';

/**
 * WebSocket接続管理クラス
 * Socket.IOの接続と切断機能を提供
 */
export class WebSocketClient implements IWebSocketClient {
  /**
   * WebSocket接続を初期化
   * @returns Socket.IOのソケットインスタンス、または接続失敗時はnull
   */
  initialize(): Socket | null {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        logger.warn('WebSocketClientはブラウザ環境でのみ初期化できます', {
          component: 'WebSocketClient',
          action: 'initialize'
        });
        return null;
      }
      
      // 共通のSocket.IOクライアントを取得
      const socket = getSocket(true);
      
      if (!socket) {
        logger.warn('Socket.IOクライアントの初期化に失敗しました', {
          component: 'WebSocketClient',
          action: 'initialize'
        });
        return null;
      }
      
      logger.info('WebSocketClient: Socket.IO接続を初期化しました', {
        component: 'WebSocketClient',
        action: 'initialize',
        connected: socket.connected,
        id: socket.id
      });
      
      return socket;
    } catch (error) {
      logger.error('Socket.IO初期化エラー:', error, {
        component: 'WebSocketClient',
        action: 'initialize',
        error
      });
      return null;
    }
  }

  /**
   * 現在のSocketインスタンスを取得
   * @returns Socket.IOのソケットインスタンス、または未接続時はnull
   */
  getSocket(): Socket | null {
    return getSocket(false);
  }

  /**
   * 接続状態を確認
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean {
    const socket = this.getSocket();
    return !!socket?.connected;
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    disconnectSocket();
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    // 新しいclient.tsは自動的に再接続を処理するので何もしない
    logger.info('WebSocketClientの再接続は自動的に処理されます', {
      component: 'WebSocketClient',
      action: 'scheduleReconnect'
    });
  }
}

// シングルトンインスタンス
let webSocketClientInstance: WebSocketClient | null = null;

/**
 * WebSocketClientのシングルトンインスタンスを取得
 * @returns WebSocketClientインスタンス
 */
export function getWebSocketClient(): WebSocketClient {
  // テスト環境での循環参照を防止するため、インスタンスがない場合は即座に作成
  if (!webSocketClientInstance) {
    webSocketClientInstance = new WebSocketClient();
  }
  return webSocketClientInstance;
}

// テスト用にシングルトンインスタンスをリセットする関数
export function resetWebSocketClientForTesting(): void {
  webSocketClientInstance = null;
}
