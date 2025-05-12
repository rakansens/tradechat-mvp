/**
 * services/socket/websocket-client.ts
 * WebSocket接続管理を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: client.tsを改良し、インターフェースに準拠
 */

import { Socket } from 'socket.io-client';
import { initializeSocketClient, getSocket } from '../../utils/socketClient';
import { logger } from '../../utils/logger';
import { IWebSocketClient } from './interfaces';

// 定数
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

/**
 * WebSocket接続管理クラス
 * Socket.IOの接続と切断機能を提供
 */
export class WebSocketClient implements IWebSocketClient {
  private socket: Socket | null = null;
  private connectedFlag = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

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
      
      // Socket.io接続を初期化（デフォルトの名前空間を使用、既存があれば再利用）
      initializeSocketClient(false); // 既存ソケットがあれば再利用
      this.socket = getSocket(true);
      
      // 接続イベントのハンドラを設定
      if (this.socket) {
        // 接続成功時
        this.socket.on('connect', () => {
          logger.info('Socket.IO接続成功', {
            component: 'WebSocketClient',
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
            component: 'WebSocketClient',
            action: 'disconnect',
            reason
          });
          
          this.connectedFlag = false;
          
          // 自動再接続を試みる
          this.scheduleReconnect();
        });
        
        // 接続エラー時
        this.socket.on('connect_error', (error) => {
          logger.error(`Socket.IO接続エラー: ${error.message}`, {
            component: 'WebSocketClient',
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
    return this.socket;
  }

  /**
   * 接続状態を確認
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean {
    return this.connectedFlag && !!this.socket?.connected;
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    if (this.socket) {
      try {
        this.socket.disconnect();
        this.connectedFlag = false;
        
        logger.info('Socket.IO接続を切断しました', {
          component: 'WebSocketClient',
          action: 'disconnect'
        });
      } catch (error) {
        logger.error('Socket.IO切断エラー:', error, {
          component: 'WebSocketClient',
          action: 'disconnect',
          error
        });
      }
    }
    
    // 再接続タイマーをクリア
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    // 既に再接続タイマーが設定されている場合は何もしない
    if (this.reconnectTimer) {
      return;
    }
    
    // 再接続試行回数が上限に達した場合
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('最大再接続試行回数に達しました', {
        component: 'WebSocketClient',
        action: 'scheduleReconnect',
        attempts: this.reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS
      });
      return;
    }
    
    // 再接続タイマーを設定
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      
      logger.info(`再接続を試みています (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`, {
        component: 'WebSocketClient',
        action: 'scheduleReconnect',
        attempts: this.reconnectAttempts,
        maxAttempts: MAX_RECONNECT_ATTEMPTS
      });
      
      // 再接続を試みる
      this.initialize();
      
      // タイマーをクリア
      this.reconnectTimer = null;
    }, RECONNECT_DELAY);
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
