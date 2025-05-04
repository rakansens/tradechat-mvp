// app/api/socket/route.ts
// WebSocket接続のAPIハンドラ

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { SocketMessage, SocketMessageType, handleServerSocketMessage } from '../../../utils/socketUtils';

// アクティブなWebSocket接続を追跡
const activeConnections = new Map<string, WebSocket>();

// メッセージを送信する関数
export function sendMessageToClient(clientId: string, message: SocketMessage): boolean {
  const connection = activeConnections.get(clientId);
  if (!connection) return false;
  
  try {
    connection.send(JSON.stringify(message));
    return true;
  } catch (error) {
    console.error(`WebSocket送信エラー: ${error}`);
    return false;
  }
}

// メッセージをブロードキャストする関数
export function broadcastMessage(message: SocketMessage, exceptClientId?: string): number {
  let sentCount = 0;
  
  for (const [clientId, connection] of activeConnections.entries()) {
    if (exceptClientId && clientId === exceptClientId) continue;
    
    try {
      connection.send(JSON.stringify(message));
      sentCount++;
    } catch (error) {
      console.error(`WebSocketブロードキャストエラー: ${error}`);
    }
  }
  
  return sentCount;
}

export async function GET(req: NextRequest) {
  try {
    const { socket: _socket, response } = Deno.upgradeWebSocket(req);
    const socket = _socket as unknown as WebSocket;
    
    // クライアントIDを生成
    const clientId = uuidv4();
    
    // 接続時の処理
    socket.onopen = () => {
      console.log(`WebSocket接続確立: ${clientId}`);
      activeConnections.set(clientId, socket);
    };
    
    // メッセージ受信時の処理
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SocketMessage;
        console.log(`WebSocketメッセージ受信 (${clientId}):`, message.type);
        
        // サーバー側メッセージハンドラに渡す
        handleServerSocketMessage(message);
        
        // 必要に応じて他のクライアントにブロードキャスト
        // broadcastMessage(message, clientId);
      } catch (error) {
        console.error(`WebSocketメッセージ処理エラー: ${error}`);
      }
    };
    
    // 接続終了時の処理
    socket.onclose = () => {
      console.log(`WebSocket接続終了: ${clientId}`);
      activeConnections.delete(clientId);
    };
    
    // エラー発生時の処理
    socket.onerror = (error) => {
      console.error(`WebSocketエラー (${clientId}): ${error}`);
    };
    
    return response;
  } catch (error) {
    console.error(`WebSocket初期化エラー: ${error}`);
    return new Response('WebSocket接続のみ許可されています', { status: 426 });
  }
} 