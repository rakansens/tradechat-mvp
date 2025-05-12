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
import { initializeSocketClient, getSocket } from '../../utils/socketClient';
import { logger } from '../../utils/logger';

// 定数
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export class SocketClient {
  private socket: Socket | null = null;
  private connectedFlag = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  /**
   * マーケットデータ用のSocket.IO接続を初期化
   * @returns Socket.IOのソケットインスタンス
   */
  initialize(): Socket | null {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        logger.warn('SocketClientはブラウザ環境でのみ初期化できます', {
          component: 'SocketClient',
          action: 'initialize'
        });
        return null;
      }
      
      // Socket.io接続を初期化（デフォルトの名前空間を使用、既存があれば再利用）
      initializeSocketClient(false); // 既存ソケットがあれば再利用
      this.socket = getSocket(true);
      
      // 接続イベントのハンドラを設定
      if (this.socket) {
        // 接続成功時
        this.socket.on('connect', () => {
          logger.info('Socket.IO接続成功', {
            component: 'SocketClient',
            action: 'connect'
          });
          
          this.connectedFlag = true;
          this.reconnectAttempts = 0;
          
          // 再接続タイマーをクリア
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
          }
        });
        
        // 切断時
        this.socket.on('disconnect', (reason) => {
          logger.warn(`Socket.IO切断: ${reason}`, {
            component: 'SocketClient',
            action: 'disconnect'
          });
          
          this.connectedFlag = false;
          
          // 自動再接続を試みる
          this.scheduleReconnect();
        });
        
        // 接続エラー時
        this.socket.on('connect_error', (error) => {
          logger.error(`Socket.IO接続エラー: ${error.message}`, {
            component: 'SocketClient',
            action: 'connect_error',
            error
          });
          
          this.connectedFlag = false;
          
          // 自動再接続を試みる
          this.scheduleReconnect();
        });
      }
      
      return this.socket;
    } catch (error) {
      logger.error('Socket.IO初期化エラー:', error, {
        component: 'SocketClient',
        action: 'initialize'
      });
      return null;
    }
  }

  /**
   * 現在のSocket.IOインスタンスを取得、なければ初期化
   */
  getSocket(): Socket | null {
    if (this.socket && this.socket.connected) return this.socket;
    this.socket = getSocket(true);
    if (!this.socket) {
      this.initialize();
      this.socket = getSocket(false);
    }
    return this.socket;
  }

  /**
   * ソケット接続を切断
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // 接続状態をリセット
    this.connectedFlag = false;
    
    // 再接続タイマーをクリア
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    logger.info('Socket.IO接続を切断しました', {
      component: 'SocketClient',
      action: 'disconnect'
    });
  }

  /**
   * 接続状態を取得
   */
  isConnected(): boolean {
    if (!this.socket) return false;
    return this.socket.connected;
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    const attempts = this.reconnectAttempts;
    const limit: number = MAX_RECONNECT_ATTEMPTS;

    // 再接続試行回数が上限に達した場合は再接続を停止
    if (attempts >= limit) {
      logger.error(`最大再接続試行回数(${limit})に達しました`, {
        component: 'SocketClient',
        action: 'scheduleReconnect'
      });
      return;
    }

    // 既にタイマーがあれば何もしない
    if (this.reconnectTimer) {
      return;
    }
    
    // 再接続タイマーの設定
    this.reconnectTimer = global.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts = attempts + 1;

      logger.info(`再接続を試みます (${this.reconnectAttempts}/${limit})`, {
        component: 'SocketClient',
        action: 'reconnect'
      });

      // ソケットを再初期化
      this.initialize();
    }, RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts)); // 指数バックオフ
  }
}

// シングルトンインスタンス
let clientInstance: SocketClient | null = null;

// シングルトンゲッター
export function getSocketClient(): SocketClient {
  if (!clientInstance) {
    clientInstance = new SocketClient();
  }
  return clientInstance;
}
