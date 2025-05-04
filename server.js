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
const MASTRA_PORT = 4112;

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
        
        if (!requestId) {
          console.warn('リクエストIDがないレスポンス');
          return;
        }
        
        // pendingCaptureRequestsを検索
        if (pendingCaptureRequests.has(requestId)) {
          const request = pendingCaptureRequests.get(requestId);
          
          // Promiseを解決
          clearTimeout(request.timeout);
          request.resolve(imageData);
          pendingCaptureRequests.delete(requestId);
          console.log(`キャプチャ成功: ${requestId}`);
        } else {
          console.warn(`不明なキャプチャレスポンス: ${requestId}`);
        }
      } catch (error) {
        console.error('キャプチャレスポンス処理エラー:', error);
      }
    });
    
    // エラーメッセージ処理
    socket.on('error_message', (data) => {
      try {
        console.log('エラーメッセージ受信:', data);
        const { requestId, error } = data;
        
        if (!requestId) {
          console.warn('リクエストIDがないエラー');
          return;
        }
        
        // pendingCaptureRequestsを検索
        if (pendingCaptureRequests.has(requestId)) {
          const request = pendingCaptureRequests.get(requestId);
          
          // Promiseを拒否
          clearTimeout(request.timeout);
          request.reject(new Error(error));
          pendingCaptureRequests.delete(requestId);
        } else {
          console.warn(`不明なエラーメッセージ: ${requestId}`);
        }
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
        pendingCaptureRequests.delete(requestId);
        reject(new Error('キャプチャリクエストがタイムアウトしました'));
      }, timeoutMs);
      
      // リクエストとPromiseを関連付けて保存
      pendingCaptureRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });
      
      // リクエストを全クライアントに直接ブロードキャスト
      io.emit('capture_request', { requestId });
      console.log(`キャプチャリクエストをブロードキャスト: ${requestId}`);
    });
  };
  
  // 以下のイベントリスナーは接続ハンドラ内に移動しました
  
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