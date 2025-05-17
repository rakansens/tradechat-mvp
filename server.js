// server.js
// Socket.ioを統合したNextサーバー - WebSocketの共有データ方式を実装

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
// EventEmitterをインポート
const logger = require("./utils/serverLogger");
const { EventEmitter } = require('events');

// WebSocketマネージャーのモック実装
class MockBitgetWebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.subscriptions = new Map();
    this.connectionState = 'disconnected';
  }

  connect() {
    this.connectionState = 'connected';
    logger.info('MockBitgetWebSocketManager: 接続しました');
    this.emit('connected');
    return true;
  }

  disconnect() {
    this.connectionState = 'disconnected';
    logger.info('MockBitgetWebSocketManager: 切断しました');
    return true;
  }

  subscribe(symbol, type, timeframe, exchangeType = 'spot') {
    const key = `${symbol}:${type}:${timeframe || ''}:${exchangeType}`;
    this.subscriptions.set(key, { symbol, type, timeframe, exchangeType });
    logger.info(`MockBitgetWebSocketManager: 購読しました - ${key}`);
    return true;
  }

  unsubscribe(symbol, type, timeframe, exchangeType = 'spot') {
    const key = `${symbol}:${type}:${timeframe || ''}:${exchangeType}`;
    this.subscriptions.delete(key);
    logger.info(`MockBitgetWebSocketManager: 購読解除しました - ${key}`);
    return true;
  }

  getSubscriptions() {
    return Array.from(this.subscriptions.values());
  }

  getConnectionState() {
    return this.connectionState;
  }

  isConnected() {
    return this.connectionState === 'connected';
  }
}

const BitgetWebSocketManager = MockBitgetWebSocketManager;
const { default: SocketDataBroadcaster } = require('./server/socketDataBroadcaster');

// Socket.IOイベント発行用のグローバル関数を定義
// TypeScriptの実装を直接参照するのではなく、サーバー自体に実装

/**
 * Socket.IOイベントを全クライアントに送信する関数
 * 
 * @param {string} eventName イベント名
 * @param {any} data 送信データ
 * @returns {Promise<{success: boolean, error?: string, clientCount?: number}>} 成功したかどうかと追加情報
 */
global.emitSocketEvent = async (eventName, data) => {
  try {
    if (!socketDataBroadcaster) {
      console.warn(`SocketDataBroadcasterが初期化されていません。イベント ${eventName} を送信できません。`);
      return { success: false, error: 'SocketDataBroadcasterが初期化されていません' };
    }

    const connectedClients = socketDataBroadcaster.io.sockets.sockets.size;

    if (connectedClients === 0) {
      console.warn(`接続中のクライアントがありません。イベント ${eventName} を送信できません。`);
      return { success: false, error: '接続中のクライアントがありません', clientCount: 0 };
    }

    // 全クライアントにイベントを送信
    socketDataBroadcaster.io.emit(eventName, data);

    logger.info(`イベント ${eventName} を ${connectedClients} クライアントに送信しました`);

    return { success: true, clientCount: connectedClients };
  } catch (error) {
    console.error(`イベント ${eventName} の送信中にエラーが発生しました:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー'
    };
  }
};

// 環境変数の設定
const dev = process.env.NODE_ENV !== 'production';
let PORT = process.env.PORT || 3000;
let ACTUAL_PORT = PORT;
let MAX_PORT_ATTEMPTS = 10; // 最大試行回数

// Nextアプリの初期化
const app = next({ dev });
const handle = app.getRequestHandler();

// Socket.IO関連の変数
const activeConnections = new Map();
const pendingCaptureRequests = new Map();
let setupComplete = false;
let io;
let bitgetWsManager;
let socketDataBroadcaster;

// 画像保存用のディレクトリとマップ
const CHART_IMAGES_DIR = path.join(__dirname, 'public', 'chart-images');
const chartImagesMap = new Map(); // メモリ内の画像マップ（ID -> データ）

// 画像保存ディレクトリの作成（存在しない場合）
if (!fs.existsSync(CHART_IMAGES_DIR)) {
  fs.mkdirSync(CHART_IMAGES_DIR, { recursive: true });
  logger.info(`画像保存ディレクトリを作成しました: ${CHART_IMAGES_DIR}`);
}

// Mastraのデフォルトポートと異なる値を使用
const MASTRA_PORT = 4112;

app.prepare().then(() => {
  // HTTPサーバーの作成
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Socket.IO handshake & polling endpoints are handled by Socket.IO's own listener.
    // If the request path starts with /socket.io, do nothing here so the next listener can respond.
    if (parsedUrl.pathname.startsWith('/socket.io')) {
      return;
    }
    
    // 画像表示用のエンドポイント
    if (parsedUrl.pathname.startsWith('/api/chart-image/')) {
      try {
        const imageId = parsedUrl.pathname.split('/').pop();
        
        // メモリ内の画像マップから取得を試みる
        if (chartImagesMap.has(imageId)) {
          const imageData = chartImagesMap.get(imageId);
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=86400'
          });
          res.end(buffer);
          return;
        }
        
        // ファイルシステムから取得を試みる
        const imagePath = path.join(CHART_IMAGES_DIR, `${imageId}.png`);
        if (fs.existsSync(imagePath)) {
          const imageStream = fs.createReadStream(imagePath);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=86400'
          });
          imageStream.pipe(res);
          return;
        }
        
        // グローバル変数から取得を試みる
        if (global.chartImages && global.chartImages.has(imageId)) {
          const imageData = global.chartImages.get(imageId);
          const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': buffer.length,
            'Cache-Control': 'public, max-age=86400'
          });
          res.end(buffer);
          return;
        }
        
        // 画像が見つからない場合
        res.writeHead(404);
        res.end('画像が見つかりません');
        return;
      } catch (error) {
        console.error('画像取得エラー:', error);
        res.writeHead(500);
        res.end('サーバーエラー');
        return;
      }
    }
    
    handle(req, res, parsedUrl);
  });

  // Socket.ioサーバーの初期化 - CORSを許可
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // ピングタイムアウトと接続タイムアウト設定
    pingTimeout: 60000,
    connectTimeout: 30000,
    // クライアント側と同じtransports設定を使用
    transports: ['websocket', 'polling']
  });
  
  logger.info('Socket.IOサーバーを初期化中...');
  
  // グローバル変数としてioを設定（APIエンドポイントからアクセスできるように）
  global.io = io;
  
  logger.info('Socket.IOサーバーが正常に初期化されました');
  logger.info(`現在の接続数: ${io.engine.clientsCount}`);
  logger.info('グローバルemitSocketEvent関数が利用可能になりました');

  // BitgetWebSocketManagerとSocketDataBroadcasterの初期化
  bitgetWsManager = new BitgetWebSocketManager();
  socketDataBroadcaster = new SocketDataBroadcaster(io, 100); // キャッシュサイズ100
  
  // BitgetWebSocketManagerのイベントリスナー設定
  bitgetWsManager.on('orderbook', (data) => {
    const { symbol, exchangeType, data: orderBookData } = data;
    socketDataBroadcaster.broadcastOrderBook(symbol, orderBookData, exchangeType);
  });
  
  bitgetWsManager.on('kline', (data) => {
    const { symbol, timeframe, exchangeType, data: klineData } = data;
    socketDataBroadcaster.broadcastKline(symbol, timeframe, klineData, exchangeType);
  });
  
  bitgetWsManager.on('trade', (data) => {
    const { symbol, exchangeType, data: tradeData } = data;
    socketDataBroadcaster.broadcastTrade(symbol, tradeData, exchangeType);
  });
  
  // 接続を開始
  bitgetWsManager.connect();
  
  // グローバル関数として公開
  global.subscribeSymbol = (symbol, type, timeframe, exchangeType = 'spot') => {
    return bitgetWsManager.subscribe(symbol, type, timeframe, exchangeType);
  };
  
  global.unsubscribeSymbol = (symbol, type, timeframe, exchangeType = 'spot') => {
    return bitgetWsManager.unsubscribe(symbol, type, timeframe, exchangeType);
  };
  
  global.getWebSocketStatus = () => {
    return {
      connectionState: bitgetWsManager.getConnectionState(),
      subscriptions: bitgetWsManager.getSubscriptions(),
      channels: socketDataBroadcaster.getChannelStats(),
      clients: socketDataBroadcaster.getClientStats(),
      cache: socketDataBroadcaster.getCacheStats()
    };
  };
  
  // 接続イベントハンドラ
  io.on('connection', (socket) => {
    // クライアントIDの生成
    const clientId = uuidv4();
    logger.info(`Socket.IO接続確立: ${clientId}`);
    
    // クライアント情報を保存
    activeConnections.set(clientId, socket);
    socket.emit('connected', { clientId });
    
    // キャプチャリクエストメッセージの処理
    socket.on('capture_request', (data) => {
      try {
        logger.info('キャプチャリクエスト受信:', data);
        const { requestId } = data;
        
        // リクエストIDがない場合は新しく生成
        const actualRequestId = requestId || uuidv4();
        
        // 全クライアントにキャプチャリクエストをブロードキャスト
        socketDataBroadcaster.io.emit('capture_request', { requestId: actualRequestId });
      } catch (error) {
        console.error('キャプチャリクエスト処理エラー:', error);
      }
    });
    
    // キャプチャレスポンスメッセージの処理
    socket.on('capture_response', (data) => {
      try {
        logger.info('キャプチャレスポンス受信:', data.requestId);
        const { requestId, imageData } = data;
        
        if (!requestId) {
          console.warn('リクエストIDがないレスポンス');
          return;
        }
        
        // 画像データのサイズをログに出力（デバッグ用）
        if (imageData) {
          const sizeKB = Math.round(imageData.length / 1024);
          logger.info(`受信した画像サイズ: ${requestId} - ${sizeKB}KB`);
        }
        
        // 1. 通常のリクエスト処理
        if (pendingCaptureRequests.has(requestId)) {
          const request = pendingCaptureRequests.get(requestId);
          
          // Promiseを解決
          clearTimeout(request.timeout);
          request.resolve(imageData);
          pendingCaptureRequests.delete(requestId);
          logger.info(`キャプチャ成功: ${requestId}`);
          return;
        }
        
        // 2. タイムアウト後のレスポンス処理
        if (expiredCaptureRequests.has(requestId)) {
          const expiredRequest = expiredCaptureRequests.get(requestId);
          
          // 期限切れリクエストがまだ有効か確認
          if (Date.now() < expiredRequest.expiryTime) {
            logger.info(`タイムアウト後のレスポンスを処理: ${requestId}`);
            
            // 画像を保存してログに記録
            const imageId = storeChartImage(imageData);
            logger.info(`タイムアウト後の画像を保存: ${requestId} -> ${imageId}`);
            
            // クライアントに通知
            socketDataBroadcaster.io.emit('delayed_capture_success', {
              requestId, 
              imageId,
              message: 'タイムアウト後に画像を受信しました'
            });
            
            expiredCaptureRequests.delete(requestId);
            return;
          }
          
          // 期限切れの場合はマップから削除
          expiredCaptureRequests.delete(requestId);
          logger.info(`期限切れリクエストを削除: ${requestId}`);
          return;
        }
        
        // 3. 不明なレスポンス
        console.warn(`不明なキャプチャレスポンス: ${requestId}`);
        
        // 不明なレスポンスでも画像を保存しておく
        if (imageData) {
          const imageId = storeChartImage(imageData);
          logger.info(`不明なレスポンスの画像を保存: ${requestId} -> ${imageId}`);
        }
      } catch (error) {
        console.error('キャプチャレスポンス処理エラー:', error);
      }
    });
    
    // エラーメッセージ処理
    socket.on('error_message', (data) => {
      try {
        logger.info('エラーメッセージ受信:', data);
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
      logger.info(`Socket.IO接続終了: ${clientId}`);
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
          logger.info(`古いリクエストを削除: ${requestId}`);
        }
      }
    } catch (error) {
      console.error('クリーンアップ処理エラー:', error);
    }
  }, 5 * 60 * 1000);

  // タイムアウト後もレスポンスを処理するためのマップ
  const expiredCaptureRequests = new Map();
  
  // グローバルに関数をエクスポート - キャプチャリクエスト
  global.requestCapture = (timeoutMs = 15000) => {
    return new Promise((resolve, reject) => {
      if (!setupComplete) {
        reject(new Error('Socket.IOサーバーの初期化が完了していません'));
        return;
      }
      
      // 接続状態の確認
      logger.info(`Socket.IOサーバー状態 - 接続数: ${io.engine.clientsCount}`);
      
      const requestId = uuidv4();
      logger.info(`グローバル関数からキャプチャをリクエスト: ${requestId}`);
      
      // タイムアウト設定
      const timeout = setTimeout(() => {
        console.warn(`キャプチャリクエストがタイムアウト: ${requestId}`);
        
        // タイムアウト後もリクエスト情報を保持
        const request = pendingCaptureRequests.get(requestId);
        if (request) {
          // 期限切れリクエストとして保存
          expiredCaptureRequests.set(requestId, {
            resolve,
            timestamp: Date.now(),
            expiryTime: Date.now() + 30000 // さらに30秒間保持
          });
        }
        
        pendingCaptureRequests.delete(requestId);
        reject(new Error('キャプチャリクエストがタイムアウトしました'));
        
        // タイムアウト後に再度リクエストを送信
        logger.info(`タイムアウト後に再度リクエストを送信: ${requestId}`);
        socketDataBroadcaster.io.emit('capture_request', { requestId });
      }, timeoutMs);
      
      // リクエストとPromiseを関連付けて保存
      pendingCaptureRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        timestamp: Date.now()
      });
      
      // リクエストを全クライアントに直接ブロードキャスト
      socketDataBroadcaster.io.emit('capture_request', { requestId });
      logger.info(`キャプチャリクエストをブロードキャスト: ${requestId}`);
    });
  };
  
  // グローバルに関数をエクスポート - 画像保存
  global.storeChartImage = (imageData) => {
    try {
      if (!imageData) {
        console.error('画像データがありません');
        return null;
      }
      
      // 画像IDの生成
      const imageId = `chart-${uuidv4()}`;
      
      // メモリ内のマップに保存
      chartImagesMap.set(imageId, imageData);
      
      // ファイルとしても保存（非同期で行い、処理を待たない）
      try {
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const imagePath = path.join(CHART_IMAGES_DIR, `${imageId}.png`);
        
        fs.writeFile(imagePath, buffer, (err) => {
          if (err) {
            console.error(`画像ファイル保存エラー: ${err.message}`);
          } else {
            logger.info(`画像をファイルに保存しました: ${imagePath}`);
          }
        });
      } catch (fileError) {
        console.error('画像ファイル保存中にエラー:', fileError);
        // ファイル保存に失敗してもメモリ内には保存されているので処理は続行
      }
      
      // 画像のURLを生成して返す
      return imageId;
    } catch (error) {
      console.error('画像保存エラー:', error);
      return null;
    }
  };
  
  // サーバー起動のエラーハンドリング
  let portAttempts = 0;
  
  function tryListenOnPort(port) {
    ACTUAL_PORT = port;
    server.listen(ACTUAL_PORT);
  }
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      portAttempts++;
      
      if (portAttempts >= MAX_PORT_ATTEMPTS) {
        console.error(`利用可能なポートが見つかりません。${MAX_PORT_ATTEMPTS}回試行しました。`);
        process.exit(1);
      }
      
      // ポート番号をインクリメント
      const nextPort = ACTUAL_PORT + 1;
      logger.info(`ポート ${ACTUAL_PORT} は既に使用されています。ポート ${nextPort} を試します...`);
      
      // サーバーを閉じて新しいポートで再試行
      server.close();
      setTimeout(() => {
        tryListenOnPort(nextPort);
      }, 100);
    } else {
      console.error('サーバー起動エラー:', error);
      process.exit(1);
    }
  });
  
  // サーバー起動
  tryListenOnPort(PORT);
  
  // サーバーが正常に起動したときのハンドラ
  server.on('listening', () => {
    
    // 実際に使用されているポートを記録
    ACTUAL_PORT = server.address().port;
    
    logger.info(`> Next.jsサーバー起動完了: http://localhost:${ACTUAL_PORT}`);
    logger.info(`> チャート画像API: http://localhost:${ACTUAL_PORT}/api/chart-image/{imageId}`);
    
    // クライアント側がポート番号を知るための環境変数を設定
    process.env.NEXT_PUBLIC_SERVER_PORT = ACTUAL_PORT.toString();
    
    setupComplete = true;
    
    // 定期的なクリーンアップタスク（1分ごと）
    setInterval(() => {
      try {
        // 接続状態の確認
        if (bitgetWsManager && !bitgetWsManager.isConnected()) {
          logger.info('WebSocket接続が切断されています。再接続を試みます...');
          bitgetWsManager.connect();
        }
      } catch (error) {
        console.error('定期的なクリーンアップタスクでエラーが発生しました:', error);
      }
    }, 60000);
  });
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  logger.info('サーバーをシャットダウンしています...');
  
  // BitgetWebSocketManagerの切断
  if (bitgetWsManager) {
    bitgetWsManager.disconnect();
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('サーバーをシャットダウンしています...');
  
  // BitgetWebSocketManagerの切断
  if (bitgetWsManager) {
    bitgetWsManager.disconnect();
  }
  
  process.exit(0);
});
