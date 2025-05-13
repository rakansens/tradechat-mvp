// services/socket/core.ts - 新規作成
// 責務: Socket.IOの低レベル接続管理のみを担当
import { Socket, io } from 'socket.io-client';
import { logger } from '@/utils/logger';

// プライベートモジュール変数
let socket: Socket | null = null;
let isConnecting = false;
let connectionAttempts = 0;

/**
 * Socket.IOコアモジュール - 単一の接続を管理
 */
export class SocketCore {
  // Socket.IO接続の取得またはセットアップ
  static getSocket(forceInit = false): Socket | null {
    if (socket && socket.connected && !forceInit) return socket;
    if (isConnecting) return socket;
    
    try {
      isConnecting = true;
      
      // 既存の接続を切断
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      
      // 新しい接続を作成
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      socket = io(baseUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });
      
      // ライフサイクルイベント登録
      socket.on('connect', () => {
        isConnecting = false;
        connectionAttempts = 0;
        logger.info('Socket接続成功', { id: socket?.id });
      });
      
      socket.on('disconnect', (reason) => {
        logger.warn(`Socket切断: ${reason}`);
      });
      
      socket.on('connect_error', (error) => {
        isConnecting = false;
        connectionAttempts++;
        logger.error(`Socket接続エラー: ${error.message}`);
      });
      
      return socket;
    } catch (error) {
      isConnecting = false;
      logger.error('Socket初期化エラー', { error });
      return null;
    }
  }
  
  // 接続の切断
  static disconnect(): void {
    if (!socket) return;
    socket.disconnect();
    socket = null;
    isConnecting = false;
  }
  
  // 接続状態の取得
  static getConnectionStatus(): { connected: boolean; id?: string; } {
    return {
      connected: socket?.connected || false,
      id: socket?.id
    };
  }
} 