// utils/serverSocket.ts
// サーバーサイドSocket.IO操作用ユーティリティ
// 作成: 2025-05-07 - Mastraツールからのリクエストをブラウザに通知するためのSocket.IO操作関数

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from './logger';

// シングルトンSocket.IOサーバーインスタンス
let io: SocketIOServer | null = null;

/**
 * Socket.IOサーバーを初期化
 * 
 * @param httpServer HTTPサーバーインスタンス
 * @param existingIo 既存のSocket.IOサーバーインスタンス（オプション）
 * @returns 初期化されたSocket.IOサーバーインスタンス
 */
export function initSocketServer(
  httpServer: HTTPServer, 
  existingIo?: SocketIOServer
): SocketIOServer {
  // 既存のSocket.IOインスタンスが提供された場合はそれを使用
  if (existingIo) {
    io = existingIo;
    logger.info('既存のSocket.IOインスタンスを使用します', {
      component: 'serverSocket',
      action: 'initSocketServer',
      mode: 'existing'
    });
    return io;
  }
  
  // 既にinitSocketServerが呼び出されている場合は既存のインスタンスを返す
  if (io) {
    return io;
  }

  // 新しいSocket.IOインスタンスを作成
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  logger.info('新しいSocket.IOインスタンスを作成しました', {
    component: 'serverSocket',
    action: 'initSocketServer',
    mode: 'new'
  });

  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`新しいクライアント接続: ${clientId}`, {
      component: 'serverSocket',
      action: 'connection'
    });

    // クライアントに接続成功を通知
    socket.emit('connected', { clientId });

    // 切断イベント
    socket.on('disconnect', () => {
      logger.info(`クライアント切断: ${clientId}`, {
        component: 'serverSocket',
        action: 'disconnect'
      });
    });
  });

  logger.info('Socket.IOサーバー初期化完了', {
    component: 'serverSocket',
    action: 'initSocketServer'
  });

  return io;
}

/**
 * Socket.IOサーバーインスタンスを取得
 * 
 * @returns Socket.IOサーバーインスタンス
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * 全クライアントにイベントを送信
 * 
 * @param eventName イベント名
 * @param data 送信データ
 * @returns 成功したかどうかと追加情報
 */
export async function emitSocketEvent(eventName: string, data: any): Promise<{ success: boolean; error?: string; clientCount?: number }> {
  try {
    if (!io) {
      logger.warn(`Socket.IOサーバーが初期化されていません。イベント ${eventName} を送信できません。`, {
        component: 'serverSocket',
        action: 'emitSocketEvent'
      });
      return { success: false, error: 'Socket.IOサーバーが初期化されていません' };
    }

    const connectedClients = io.sockets.sockets.size;
    
    if (connectedClients === 0) {
      logger.warn(`接続中のクライアントがありません。イベント ${eventName} を送信できません。`, {
        component: 'serverSocket',
        action: 'emitSocketEvent'
      });
      return { success: false, error: '接続中のクライアントがありません', clientCount: 0 };
    }

    // 全クライアントにイベントを送信
    io.emit(eventName, data);

    logger.info(`イベント ${eventName} を ${connectedClients} クライアントに送信しました`, {
      component: 'serverSocket',
      action: 'emitSocketEvent',
      clientCount: connectedClients
    });

    return { success: true, clientCount: connectedClients };
  } catch (error) {
    logger.error(`イベント ${eventName} の送信中にエラーが発生しました:`, error, {
      component: 'serverSocket',
      action: 'emitSocketEvent'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}
