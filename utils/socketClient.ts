// utils/socketClient.ts
// Socket.ioクライアント接続の管理

import { Socket, io } from 'socket.io-client';
import { captureChartAsBase64 } from './screenshotUtils';

// シングルトンソケットインスタンス
let socket: Socket | null = null;

// ソケット初期化状態
let isInitialized = false;
let clientId = '';

/**
 * Socket.ioクライアントを初期化
 * チャートキャプチャのイベントハンドラを設定
 */
export function initializeSocketClient() {
  if (isInitialized) return;
  
  // ブラウザ環境かどうかを確認
  if (typeof window === 'undefined') {
    console.warn('socketClientはブラウザ環境でのみ初期化できます');
    return;
  }
  
  try {
    // Socket.io接続を初期化
    socket = io({
      reconnectionAttempts: 5,
      timeout: 10000
    });
    
    // 接続成功時の処理
    socket.on('connected', (data: { clientId: string }) => {
      console.log('Socket.IO接続成功:', data);
      clientId = data.clientId;
      isInitialized = true;
    });
    
    // キャプチャリクエスト受信時の処理
    socket.on('capture_request', async (data: { requestId: string }) => {
      console.log('キャプチャリクエスト受信:', data);
      
      try {
        // チャート要素をキャプチャ
        // トレーディングビューチャートのセレクタを指定
        // ここの値はプロジェクト固有のセレクタに変更する必要がある
        const chartSelector = 'canvas'; // 広めのセレクタで試す
        const imageData = await captureChartAsBase64(chartSelector);
        
        if (imageData) {
          console.log('キャプチャ成功、データ送信 - ID:', data.requestId);
          // 成功時はレスポンスを送信
          socket?.emit('capture_response', {
            requestId: data.requestId,
            imageData
          });
        } else {
          console.warn('チャート要素が見つかりません - ID:', data.requestId);
          // キャプチャ失敗時
          socket?.emit('error_message', {
            requestId: data.requestId,
            error: 'チャート要素を見つけられませんでした'
          });
        }
      } catch (error) {
        console.error('キャプチャエラー:', error);
        
        // エラー時のレスポンス
        socket?.emit('error_message', {
          requestId: data.requestId,
          error: `キャプチャ処理中にエラーが発生しました: ${error}`
        });
      }
    });
    
    // 切断時の処理
    socket.on('disconnect', () => {
      console.log('Socket.IO切断');
      isInitialized = false;
    });
    
    // エラー発生時の処理
    socket.on('connect_error', (error) => {
      console.error('Socket.IO接続エラー:', error);
      isInitialized = false;
    });
    
    console.log('Socket.IO初期化完了');
  } catch (error) {
    console.error('Socket.IO初期化エラー:', error);
  }
}

/**
 * クライアント側からキャプチャをリクエスト（テスト用）
 * @returns キャプチャしたBase64画像データ
 */
export function requestCaptureFromClient(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!socket || !isInitialized) {
      reject(new Error('Socket.IO接続が初期化されていません'));
      return;
    }
    
    const requestId = Math.random().toString(36).substring(2, 15);
    
    // タイムアウト設定
    const timeout = setTimeout(() => {
      socket?.off('capture_response', responseHandler);
      socket?.off('error_message', errorHandler);
      reject(new Error('キャプチャリクエストがタイムアウトしました'));
    }, 10000);
    
    // レスポンスハンドラ
    const responseHandler = (data: { requestId: string, imageData: string }) => {
      if (data.requestId === requestId) {
        clearTimeout(timeout);
        resolve(data.imageData);
        socket?.off('capture_response', responseHandler);
        socket?.off('error_message', errorHandler);
      }
    };
    
    // エラーハンドラ
    const errorHandler = (data: { requestId: string, error: string }) => {
      if (data.requestId === requestId) {
        clearTimeout(timeout);
        reject(new Error(data.error));
        socket?.off('capture_response', responseHandler);
        socket?.off('error_message', errorHandler);
      }
    };
    
    // ハンドラを登録
    socket.on('capture_response', responseHandler);
    socket.on('error_message', errorHandler);
    
    // リクエスト送信
    socket.emit('capture_request', { requestId });
  });
}

/**
 * ソケット接続を取得
 * @returns ソケットインスタンス
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * クライアントIDを取得
 * @returns クライアントID
 */
export function getClientId(): string {
  return clientId;
} 