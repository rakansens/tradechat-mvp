/**
 * services/socket/client.ts
 * Socket.IO通信と基本的な接続管理を担当
 *
 * 変更内容:
 * - 元のsocketService.tsから接続管理機能を分離
 * - Socket.IOの接続と切断機能を提供
 * - 接続状態監視と自動再接続機能を実装
 */

import { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { logger } from '../../utils/logger';

// シングルトンSocketインスタンス
let socketInstance: Socket | null = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // ms

/**
 * マーケットデータ用のSocket.IO接続を初期化
 * @returns Socket.IOのソケットインスタンス
 */
export function initializeSocketClient(): Socket | null {
  // サーバーサイドでは実行しない
  if (typeof window === 'undefined') {
    logger.warn('initializeSocketClientはブラウザ環境でのみ実行できます', {
      component: 'SocketClient',
      action: 'initializeSocketClient'
    });
    return null;
  }

  // 既に接続済みの場合はそのインスタンスを返す
  if (socketInstance && socketInstance.connected) {
    logger.debug('既存のSocket.IO接続を返します', {
      component: 'SocketClient',
      action: 'initializeSocketClient',
      connected: true,
      id: socketInstance.id
    });
    return socketInstance;
  }

  // 接続処理中の場合は待機
  if (isConnecting) {
    logger.debug('Socket.IO接続処理中です', {
      component: 'SocketClient',
      action: 'initializeSocketClient'
    });
    return null;
  }

  // 接続試行回数が上限を超えた場合
  if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
    logger.error(`最大接続試行回数(${MAX_CONNECTION_ATTEMPTS})に達しました`, {
      component: 'SocketClient',
      action: 'initializeSocketClient',
      attempts: connectionAttempts
    });
    return null;
  }

  try {
    isConnecting = true;
    connectionAttempts++;

    // 既存の接続がある場合は切断
    if (socketInstance) {
      try {
        socketInstance.disconnect();
        socketInstance = null;
      } catch (e) {
        logger.warn('既存のSocket.IO接続の切断に失敗しました', {
          component: 'SocketClient',
          action: 'initializeSocketClient',
          error: e
        });
      }
    }

    // Socket.io接続を初期化（デフォルトの名前空間を使用、既存があれば再利用）
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    // 接続オプションを設定
    const options = {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      transports: ['websocket', 'polling'] // WebSocketを優先し、フォールバックとしてポーリングを使用
    };

    // Socket.IO接続を作成
    socketInstance = io(baseUrl, options);
    
    // 接続成功時の処理
    socketInstance.on('connect', () => {
      logger.info('Socket.IO接続成功', {
        component: 'SocketClient',
        action: 'connect',
        id: socketInstance?.id
      });
      
      isConnecting = false;
      connectionAttempts = 0;
    });
    
    // 切断時の処理
    socketInstance.on('disconnect', (reason) => {
      logger.warn(`Socket.IO切断: ${reason}`, {
        component: 'SocketClient',
        action: 'disconnect',
        reason
      });
      
      // io client disconnect以外の理由で切断された場合は再接続しない
      if (reason === 'io client disconnect') {
        logger.info('クライアント側から切断されました。再接続は行いません。', {
          component: 'SocketClient',
          action: 'disconnect'
        });
        return;
      }
      
      // 一定時間後に再接続を試みる
      setTimeout(() => {
        logger.info('Socket.IO再接続を試みます', {
          component: 'SocketClient',
          action: 'reconnect'
        });
        socketInstance = null;
        isConnecting = false;
        initializeSocketClient();
      }, RECONNECT_DELAY);
    });
    
    // 接続エラー時の処理
    socketInstance.on('connect_error', (error) => {
      logger.error(`Socket.IO接続エラー: ${error.message}`, {
        component: 'SocketClient',
        action: 'connect_error',
        error
      });
      
      isConnecting = false;
      
      // 一定時間後に再接続を試みる
      setTimeout(() => {
        logger.info(`Socket.IO接続エラー後、再接続を試みます(${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`, {
          component: 'SocketClient',
          action: 'reconnect_after_error'
        });
        socketInstance = null;
        initializeSocketClient();
      }, RECONNECT_DELAY);
    });
    
    return socketInstance;
  } catch (error) {
    logger.error('Socket.IO初期化エラー:', {
      component: 'SocketClient',
      action: 'initializeSocketClient',
      error
    });
    
    isConnecting = false;
    return null;
  }
}

/**
 * 現在のSocket.IOインスタンスを取得、なければ初期化
 * @param forceInit 強制的に初期化するかどうか
 * @returns Socket.IOインスタンス
 */
export function getSocket(forceInit = false): Socket | null {
  if (forceInit || !socketInstance) {
    return initializeSocketClient();
  }
  return socketInstance;
}

/**
 * WebSocket接続を切断
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    try {
      socketInstance.disconnect();
      socketInstance = null;
      connectionAttempts = 0;
      isConnecting = false;
      
      logger.info('Socket.IO接続を切断しました', {
        component: 'SocketClient',
        action: 'disconnectSocket'
      });
    } catch (error) {
      logger.error('Socket.IO切断エラー:', {
        component: 'SocketClient',
        action: 'disconnectSocket',
        error
      });
    }
  }
}

// テスト用にソケットインスタンスをリセットする関数
export function resetSocketForTesting(): void {
  socketInstance = null;
  connectionAttempts = 0;
  isConnecting = false;
}
