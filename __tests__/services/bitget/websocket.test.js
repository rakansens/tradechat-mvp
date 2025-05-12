/**
 * Bitget WebSocket APIの動作確認用テストスクリプト
 * 
 * このスクリプトは、Bitgetの公式WebSocketエンドポイントに直接接続し、
 * オーダーブックとローソク足データを取得します。
 */

// WebSocketクライアント
const WebSocket = require('ws');

// Bitget WebSocketエンドポイント
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';

// 接続
const ws = new WebSocket(BITGET_WS_ENDPOINT);

// 接続イベント
ws.on('open', () => {
  console.log('Bitget WebSocketに接続しました');
  
  // Ping送信（接続維持用）
  setInterval(() => {
    ws.send(JSON.stringify({ action: 'ping' }));
  }, 20000);
  
  // BTCUSDTのオーダーブックを購読
  const subscribeOrderBook = {
    action: 'subscribe',
    arg: {
      instType: 'sp',
      channel: 'books',
      instId: 'BTCUSDT'
    }
  };
  
  // BTCUSDTの1分足ローソク足データを購読
  const subscribeCandles = {
    action: 'subscribe',
    arg: {
      instType: 'sp',
      channel: 'candle1m',
      instId: 'BTCUSDT'
    }
  };
  
  // 購読開始
  ws.send(JSON.stringify(subscribeOrderBook));
  console.log('オーダーブックの購読を開始しました');
  
  ws.send(JSON.stringify(subscribeCandles));
  console.log('ローソク足データの購読を開始しました');
});

// メッセージ受信イベント
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    
    // Pingレスポンスの場合
    if (message.action === 'pong') {
      console.log('Pingレスポンスを受信しました');
      return;
    }
    
    // エラーメッセージの場合
    if (message.code && message.code !== '0') {
      console.error('エラーメッセージを受信しました:', message);
      return;
    }
    
    // データメッセージの場合
    if (message.action === 'push' && message.arg && message.data) {
      const { instId, channel } = message.arg;
      
      // オーダーブックデータの場合
      if (channel === 'books') {
        console.log(`オーダーブックデータを受信しました (${instId}):`);
        console.log(`  Asks: ${message.data.asks ? message.data.asks.length : 0}件`);
        console.log(`  Bids: ${message.data.bids ? message.data.bids.length : 0}件`);
        
        // 最初の数件のデータを表示
        if (message.data.asks && message.data.asks.length > 0) {
          console.log('  最安値売り注文:', message.data.asks[0]);
        }
        if (message.data.bids && message.data.bids.length > 0) {
          console.log('  最高値買い注文:', message.data.bids[0]);
        }
      }
      
      // ローソク足データの場合
      if (channel === 'candle1m') {
        console.log(`ローソク足データを受信しました (${instId}):`);
        
        // ローソク足データを表示
        if (Array.isArray(message.data) && message.data.length > 0) {
          const candle = message.data[0];
          // [timestamp, open, high, low, close, volume]
          console.log(`  時間: ${new Date(parseInt(candle[0])).toLocaleString()}`);
          console.log(`  始値: ${candle[1]}`);
          console.log(`  高値: ${candle[2]}`);
          console.log(`  安値: ${candle[3]}`);
          console.log(`  終値: ${candle[4]}`);
          console.log(`  出来高: ${candle[5]}`);
        }
      }
    }
  } catch (error) {
    console.error('メッセージの解析に失敗しました:', error);
    console.error('受信データ:', data.toString());
  }
});

// エラーイベント
ws.on('error', (error) => {
  console.error('WebSocketエラーが発生しました:', error);
});

// 切断イベント
ws.on('close', (code, reason) => {
  console.log(`WebSocket接続が切断されました: ${code} ${reason}`);
});

console.log('Bitget WebSocketテストスクリプトを実行中...');
console.log('Ctrl+Cで終了できます');
