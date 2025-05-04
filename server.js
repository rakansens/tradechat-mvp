// server.js
// Socket.ioを統合したNextサーバー

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// アクティブなWebSocket接続を追跡
const activeConnections = new Map();

// 保留中のキャプチャリクエスト
const pendingCaptureRequests = new Map();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Socket.ioサーバーの初期化
  const io = socketIO(server);
  
  io.on('connection', (socket) => {
    const clientId = uuidv4();
    console.log(`Socket.IO接続確立: ${clientId}`);
    
    // クライアント情報を保存
    activeConnections.set(clientId, socket);
    socket.emit('connected', { clientId });
    
    // キャプチャリクエストメッセージの処理
    socket.on('capture_request', (data) => {
      const { requestId } = data;
      
      // リクエストIDがない場合は新しく生成
      const actualRequestId = requestId || uuidv4();
      
      // リクエストを保存
      if (!pendingCaptureRequests.has(actualRequestId)) {
        pendingCaptureRequests.set(actualRequestId, {
          clientId,
          timestamp: Date.now()
        });
      }
      
      // 全クライアントにキャプチャリクエストをブロードキャスト
      io.emit('capture_request', { requestId: actualRequestId });
    });
    
    // キャプチャレスポンスメッセージの処理
    socket.on('capture_response', (data) => {
      const { requestId, imageData } = data;
      
      if (!requestId || !pendingCaptureRequests.has(requestId)) {
        console.warn(`不明なキャプチャレスポンス: ${requestId}`);
        return;
      }
      
      const request = pendingCaptureRequests.get(requestId);
      const requestingClientId = request.clientId;
      
      // リクエスト元のクライアントにレスポンスを送信
      const requestingSocket = activeConnections.get(requestingClientId);
      if (requestingSocket) {
        requestingSocket.emit('capture_response', {
          requestId,
          imageData
        });
      }
      
      // 処理済みリクエストを削除
      pendingCaptureRequests.delete(requestId);
    });
    
    // エラーメッセージの処理
    socket.on('error_message', (data) => {
      const { requestId, error } = data;
      
      if (!requestId || !pendingCaptureRequests.has(requestId)) {
        console.warn(`不明なエラーメッセージ: ${requestId}`);
        return;
      }
      
      const request = pendingCaptureRequests.get(requestId);
      const requestingClientId = request.clientId;
      
      // リクエスト元のクライアントにエラーを送信
      const requestingSocket = activeConnections.get(requestingClientId);
      if (requestingSocket) {
        requestingSocket.emit('error_message', {
          requestId,
          error
        });
      }
      
      // 処理済みリクエストを削除
      pendingCaptureRequests.delete(requestId);
    });
    
    // 切断時の処理
    socket.on('disconnect', () => {
      console.log(`Socket.IO接続終了: ${clientId}`);
      activeConnections.delete(clientId);
    });
  });
  
  // 古いリクエストのクリーンアップ（5分ごと）
  setInterval(() => {
    const now = Date.now();
    for (const [requestId, request] of pendingCaptureRequests.entries()) {
      // 5分以上経過したリクエストを削除
      if (now - request.timestamp > 5 * 60 * 1000) {
        pendingCaptureRequests.delete(requestId);
      }
    }
  }, 5 * 60 * 1000);

  // グローバルに関数をエクスポート
  global.requestCapture = (timeoutMs = 10000) => {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      
      // タイムアウト設定
      const timeout = setTimeout(() => {
        if (pendingCaptureRequests.has(requestId)) {
          pendingCaptureRequests.delete(requestId);
          reject(new Error('キャプチャリクエストがタイムアウトしました'));
        }
      }, timeoutMs);
      
      // レスポンスハンドラの設定
      const responseHandler = (data) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          resolve(data.imageData);
          io.off('capture_response', responseHandler);
        }
      };
      
      const errorHandler = (data) => {
        if (data.requestId === requestId) {
          clearTimeout(timeout);
          reject(new Error(data.error));
          io.off('error_message', errorHandler);
        }
      };
      
      io.on('capture_response', responseHandler);
      io.on('error_message', errorHandler);
      
      // キャプチャリクエストをブロードキャスト
      io.emit('capture_request', { requestId });
    });
  };
  
  // サーバー起動
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 