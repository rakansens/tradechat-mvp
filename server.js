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

// ポート設定
const PORT = parseInt(process.env.PORT, 10) || 3000;
// Mastraのデフォルトポートと異なる値を使用
const MASTRA_PORT = 4111;

// リクエストのタイムアウトフラグ
let setupComplete = false;

app.prepare().then(() => {
  // HTTPサーバーの作成
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Socket.ioサーバーの初期化 - CORSを許可
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    // ピングタイムアウトと接続タイムアウト設定
    pingTimeout: 60000, 
    connectTimeout: 30000
  });
  
  console.log('Socket.IOサーバーを初期化中...');
  
  // 接続イベントハンドラ
  io.on('connection', (socket) => {
    // クライアントIDの生成
    const clientId = uuidv4();
    console.log(`Socket.IO接続確立: ${clientId}`);
    
    // クライアント情報を保存
    activeConnections.set(clientId, socket);
    socket.emit('connected', { clientId });
    
    // キャプチャリクエストメッセージの処理
    socket.on('capture_request', (data) => {
      try {
        console.log('キャプチャリクエスト受信:', data);
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
      } catch (error) {
        console.error('キャプチャリクエスト処理エラー:', error);
      }
    });
    
    // キャプチャレスポンスメッセージの処理
    socket.on('capture_response', (data) => {
      try {
        console.log('キャプチャレスポンス受信:', data.requestId);
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
          console.log(`レスポンスを送信: ${requestId} -> ${requestingClientId}`);
          requestingSocket.emit('capture_response', {
            requestId,
            imageData
          });
        } else {
          console.warn(`リクエスト元クライアントが見つかりません: ${requestingClientId}`);
        }
        
        // 処理済みリクエストを削除
        pendingCaptureRequests.delete(requestId);
      } catch (error) {
        console.error('キャプチャレスポンス処理エラー:', error);
      }
    });
    
    // エラーメッセージの処理
    socket.on('error_message', (data) => {
      try {
        console.log('エラーメッセージ受信:', data);
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
      } catch (error) {
        console.error('エラーメッセージ処理エラー:', error);
      }
    });
    
    // 切断時の処理
    socket.on('disconnect', () => {
      console.log(`Socket.IO接続終了: ${clientId}`);
      activeConnections.delete(clientId);
    });
    
    // エラー処理
    socket.on('error', (error) => {
      console.error(`Socket.IOエラー (${clientId}):`, error);
    });
  });
  
  // 古いリクエストのクリーンアップ（5分ごと）
  setInterval(() => {
    try {
      const now = Date.now();
      for (const [requestId, request] of pendingCaptureRequests.entries()) {
        // 5分以上経過したリクエストを削除
        if (now - request.timestamp > 5 * 60 * 1000) {
          pendingCaptureRequests.delete(requestId);
          console.log(`古いリクエストを削除: ${requestId}`);
        }
      }
    } catch (error) {
      console.error('クリーンアップ処理エラー:', error);
    }
  }, 5 * 60 * 1000);

  // グローバルに関数をエクスポート
  global.requestCapture = (timeoutMs = 15000) => {
    return new Promise((resolve, reject) => {
      if (!setupComplete) {
        reject(new Error('Socket.IOサーバーの初期化が完了していません'));
        return;
      }
      
      const requestId = uuidv4();
      console.log(`グローバル関数からキャプチャをリクエスト: ${requestId}`);
      
      // タイムアウト設定
      const timeout = setTimeout(() => {
        console.warn(`キャプチャリクエストがタイムアウト: ${requestId}`);
        cleanup();
        reject(new Error('キャプチャリクエストがタイムアウトしました'));
      }, timeoutMs);
      
      // クリーンアップ関数
      const cleanup = () => {
        io.off('capture_response', responseHandler);
        io.off('error_message', errorHandler);
        if (pendingCaptureRequests.has(requestId)) {
          pendingCaptureRequests.delete(requestId);
        }
      };
      
      // レスポンスハンドラ
      const responseHandler = (data) => {
        if (data.requestId === requestId) {
          console.log(`キャプチャレスポンス受信 (グローバル): ${requestId}`);
          clearTimeout(timeout);
          cleanup();
          resolve(data.imageData);
        }
      };
      
      // エラーハンドラ
      const errorHandler = (data) => {
        if (data.requestId === requestId) {
          console.error(`キャプチャエラー受信 (グローバル): ${requestId}`, data.error);
          clearTimeout(timeout);
          cleanup();
          reject(new Error(data.error));
        }
      };
      
      // イベントハンドラを登録
      io.on('capture_response', responseHandler);
      io.on('error_message', errorHandler);
      
      // ダミークライアントIDとして空文字列を使用
      pendingCaptureRequests.set(requestId, {
        clientId: '',
        timestamp: Date.now()
      });
      
      // キャプチャリクエストをブロードキャスト
      io.emit('capture_request', { requestId });
    });
  };
  
  // サーバー起動のエラーハンドリング
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`ポート ${PORT} は既に使用されています。別のポートを試します...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT + 1);
      }, 1000);
    } else {
      console.error('サーバー起動エラー:', error);
      process.exit(1);
    }
  });
  
  // サーバー起動
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Next.jsサーバー起動完了: http://localhost:${PORT}`);
    setupComplete = true;
  });
}); 