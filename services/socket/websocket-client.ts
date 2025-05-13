/**
 * services/socket/websocket-client.ts - 修正
 * 責務: IWebSocketClientインターフェースの実装、SocketCoreへの委譲
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 更新: 2025-05-13 - client.tsの新しいシングルトン方式を使用
 * 更新: 2025-05-13 - SocketCoreへの委譲に変更
 */

import { Socket } from 'socket.io-client';
import { logger } from '@/utils/common';
import { IWebSocketClient } from './interfaces';
import { SocketCore } from './core';

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
    if (typeof window === 'undefined') {
      logger.warn('サーバー環境では初期化できません', {
        component: 'WebSocketClient',
        action: 'initialize'
      });
      return null;
    }
    
    const socket = SocketCore.getSocket(true);
    
    if (socket) {
      logger.info('WebSocketClient: Socket.IO接続を初期化しました', {
        component: 'WebSocketClient',
        action: 'initialize',
        connected: socket.connected,
        id: socket.id
      });
    }
    
    return socket;
  }

  /**
   * 現在のSocketインスタンスを取得
   * @returns Socket.IOのソケットインスタンス、または未接続時はnull
   */
  getSocket(): Socket | null {
    return SocketCore.getSocket(false);
  }

  /**
   * 接続状態を確認
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean {
    return SocketCore.getConnectionStatus().connected;
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    SocketCore.disconnect();
    logger.info('WebSocketClientの接続を切断しました', {
      component: 'WebSocketClient',
      action: 'disconnect'
    });
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    // コアモジュールは自動再接続を処理
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
  SocketCore.disconnect(); // コアの接続もリセット
}
