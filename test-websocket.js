/**
 * test-websocket.js
 * WebSocketの接続テスト（Ping/Pongメカニズムの確認を含む）
 * 
 * このスクリプトは、Bitget WebSocketクライアントの動作をテストします。
 * 特にPing/Pongメカニズムが正しく機能しているかを確認します。
 */

const WebSocket = require('ws');

// Bitget WebSocketエンドポイント
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';

// デバッグモード
const DEBUG = true;

// テスト用のシンボルとタイムフレーム
const TEST_SYMBOL = 'BTCUSDT';
const TEST_TIMEFRAME = '1m';

// ログ出力関数
function log(message, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data && DEBUG) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// WebSocket接続テスト
function testWebSocketConnection() {
  log('=== WebSocket接続テスト開始 ===');
  
  // WebSocket接続
  const ws = new WebSocket(BITGET_WS_ENDPOINT);
  
  // 送信したPingの時間を記録
  let pingTimes = [];
  let pongReceived = 0;
  
  // Ping間隔（ミリ秒）
  const PING_INTERVAL = 30000; // 30秒
  
  // Ping送信間隔
  let pingInterval = null;
  
  // 接続時の処理
  ws.on('open', () => {
    log('WebSocket接続が確立されました');
    
    // ローソク足データを購読
    const subscribeMessage = {
      op: "subscribe",
      args: [
        {
          instType: "sp",
          channel: "candle1m",
          instId: TEST_SYMBOL
        }
      ]
    };
    
    ws.send(JSON.stringify(subscribeMessage));
    log('購読リクエストを送信しました', subscribeMessage);
    
    // Ping送信間隔を設定
    pingInterval = setInterval(() => {
      try {
        // 現在の時間を記録
        const pingTime = Date.now();
        pingTimes.push(pingTime);
        
        // Pingを送信
        ws.send("ping");
        log(`Pingを送信しました (${pingTimes.length}回目)`);
      } catch (error) {
        log(`Ping送信エラー: ${error}`);
      }
    }, PING_INTERVAL);
    
    // 2分後に接続を閉じる
    setTimeout(() => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      
      // 統計情報を表示
      const pingPongStats = {
        totalPings: pingTimes.length,
        totalPongs: pongReceived,
        successRate: pingTimes.length > 0 ? (pongReceived / pingTimes.length) * 100 : 0
      };
      
      log('=== Ping/Pong統計 ===', pingPongStats);
      log(`${pingPongStats.totalPings}回のPingに対して${pingPongStats.totalPongs}回のPongを受信しました（成功率: ${pingPongStats.successRate.toFixed(2)}%）`);
      
      // 接続を閉じる
      ws.close();
      log('WebSocket接続を閉じました');
      log('=== WebSocket接続テスト終了 ===');
      
      process.exit(0);
    }, 120000); // 2分間テスト
  });
  
  // メッセージ受信時の処理
  ws.on('message', (data) => {
    try {
      // 文字列に変換
      const messageStr = data.toString();
      
      // "pong"メッセージの処理
      if (messageStr === "pong") {
        pongReceived++;
        const latestPingTime = pingTimes[pingTimes.length - 1] || 0;
        const pongTime = Date.now();
        const latency = pongTime - latestPingTime;
        
        log(`Pongを受信しました (${pongReceived}回目, レイテンシ: ${latency}ms)`);
        return;
      }
      
      // JSONメッセージの処理
      const message = JSON.parse(messageStr);
      
      // ローソク足データの処理
      if (message.arg && message.arg.channel && message.arg.channel.startsWith('candle') && Array.isArray(message.data)) {
        log(`ローソク足データを受信しました: ${message.arg.instId} ${message.arg.channel}`, message.data[0]);
      } else {
        log('その他のメッセージを受信しました', message);
      }
    } catch (error) {
      log(`メッセージ処理エラー: ${error}`);
    }
  });
  
  // エラー発生時の処理
  ws.on('error', (error) => {
    log(`WebSocketエラー: ${error}`);
  });
  
  // 接続が閉じられた時の処理
  ws.on('close', (code, reason) => {
    log(`WebSocket接続が閉じられました (コード: ${code}, 理由: ${reason})`);
    
    if (pingInterval) {
      clearInterval(pingInterval);
    }
  });
}

// テスト実行
testWebSocketConnection();
