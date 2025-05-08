/**
 * scripts/websocket-performance-test.js
 * 
 * WebSocketの共有データ方式のパフォーマンステスト
 * - 複数クライアント接続時のパフォーマンスを測定
 * - メモリ使用量とCPU使用率を測定
 * - 結果をコンソールに出力
 */

const { io } = require('socket.io-client');
const os = require('os');
const v8 = require('v8');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  // 接続先サーバー
  SERVER_URL: 'http://localhost:3000',
  // 同時接続クライアント数
  CLIENT_COUNT: 10,
  // テスト時間（ミリ秒）
  TEST_DURATION: 60000,
  // 測定間隔（ミリ秒）
  MEASURE_INTERVAL: 5000,
  // テストするシンボル
  TEST_SYMBOLS: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
  // テストするチャネル
  TEST_CHANNELS: ['orderbook', 'kline'],
  // テストするタイムフレーム（klineチャネル用）
  TEST_TIMEFRAMES: ['1m', '5m', '15m'],
  // 結果出力ファイル
  OUTPUT_FILE: path.join(__dirname, '../logs/performance-test-results.json')
};

// 結果保存用
const results = {
  startTime: new Date().toISOString(),
  endTime: null,
  clientCount: CONFIG.CLIENT_COUNT,
  symbols: CONFIG.TEST_SYMBOLS,
  channels: CONFIG.TEST_CHANNELS,
  timeframes: CONFIG.TEST_TIMEFRAMES,
  measurements: [],
  summary: {
    avgCpuUsage: 0,
    maxCpuUsage: 0,
    avgMemoryUsage: 0,
    maxMemoryUsage: 0,
    messageCount: 0,
    messagesPerSecond: 0,
    connectSuccessRate: 0,
    disconnectCount: 0
  }
};

// クライアント接続を管理
const clients = [];
let messageCount = 0;
let disconnectCount = 0;
let connectSuccessCount = 0;

// メモリ使用量を取得（MB単位）
function getMemoryUsage() {
  const memoryUsage = process.memoryUsage();
  return {
    rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
    external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
    arrayBuffers: Math.round((memoryUsage.arrayBuffers || 0) / 1024 / 1024 * 100) / 100
  };
}

// CPU使用率を取得（%単位）
function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }
  
  return {
    idle: totalIdle / cpus.length,
    total: totalTick / cpus.length,
    usage: Math.round((1 - totalIdle / totalTick) * 100 * 100) / 100
  };
}

// 測定を実行
function measure() {
  const memoryUsage = getMemoryUsage();
  const cpuUsage = getCpuUsage();
  
  const measurement = {
    timestamp: new Date().toISOString(),
    memory: memoryUsage,
    cpu: cpuUsage,
    messageCount,
    messagesPerSecond: messageCount / (Date.now() - results.startTimestamp) * 1000,
    connectedClients: clients.filter(client => client.connected).length,
    disconnectCount
  };
  
  results.measurements.push(measurement);
  
  console.log(`[${measurement.timestamp}] 測定結果:`);
  console.log(`- メモリ使用量: RSS=${memoryUsage.rss}MB, Heap=${memoryUsage.heapUsed}/${memoryUsage.heapTotal}MB`);
  console.log(`- CPU使用率: ${cpuUsage.usage}%`);
  console.log(`- メッセージ数: ${messageCount} (${measurement.messagesPerSecond.toFixed(2)}/秒)`);
  console.log(`- 接続クライアント数: ${measurement.connectedClients}/${CONFIG.CLIENT_COUNT}`);
  console.log(`- 切断回数: ${disconnectCount}`);
  console.log('-----------------------------------');
}

// 結果をまとめる
function summarizeResults() {
  const measurements = results.measurements;
  
  if (measurements.length === 0) {
    return;
  }
  
  // CPU使用率の平均と最大値
  const cpuUsages = measurements.map(m => m.cpu.usage);
  results.summary.avgCpuUsage = cpuUsages.reduce((sum, val) => sum + val, 0) / cpuUsages.length;
  results.summary.maxCpuUsage = Math.max(...cpuUsages);
  
  // メモリ使用量の平均と最大値
  const memoryUsages = measurements.map(m => m.memory.rss);
  results.summary.avgMemoryUsage = memoryUsages.reduce((sum, val) => sum + val, 0) / memoryUsages.length;
  results.summary.maxMemoryUsage = Math.max(...memoryUsages);
  
  // メッセージ数と1秒あたりのメッセージ数
  results.summary.messageCount = messageCount;
  results.summary.messagesPerSecond = messageCount / ((Date.now() - results.startTimestamp) / 1000);
  
  // 接続成功率
  results.summary.connectSuccessRate = (connectSuccessCount / CONFIG.CLIENT_COUNT) * 100;
  
  // 切断回数
  results.summary.disconnectCount = disconnectCount;
}

// 結果を保存
function saveResults() {
  // 出力ディレクトリが存在しない場合は作成
  const outputDir = path.dirname(CONFIG.OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 結果をJSONファイルに保存
  fs.writeFileSync(
    CONFIG.OUTPUT_FILE,
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log(`結果を保存しました: ${CONFIG.OUTPUT_FILE}`);
}

// クライアントを作成
function createClient(index) {
  console.log(`クライアント ${index + 1} を作成中...`);
  
  const client = io(CONFIG.SERVER_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000
  });
  
  // 接続イベント
  client.on('connect', () => {
    console.log(`クライアント ${index + 1} が接続しました`);
    connectSuccessCount++;
    
    // ランダムなシンボルとチャネルを選択
    const symbol = CONFIG.TEST_SYMBOLS[Math.floor(Math.random() * CONFIG.TEST_SYMBOLS.length)];
    const channel = CONFIG.TEST_CHANNELS[Math.floor(Math.random() * CONFIG.TEST_CHANNELS.length)];
    
    // 購読メッセージを送信
    const subscriptionData = {
      symbol,
      type: channel
    };
    
    // klineチャネルの場合はタイムフレームも指定
    if (channel === 'kline') {
      subscriptionData.timeframe = CONFIG.TEST_TIMEFRAMES[
        Math.floor(Math.random() * CONFIG.TEST_TIMEFRAMES.length)
      ];
    }
    
    client.emit('subscribe', subscriptionData);
    console.log(`クライアント ${index + 1} が購読: ${JSON.stringify(subscriptionData)}`);
  });
  
  // 切断イベント
  client.on('disconnect', (reason) => {
    console.log(`クライアント ${index + 1} が切断されました: ${reason}`);
    disconnectCount++;
  });
  
  // エラーイベント
  client.on('connect_error', (error) => {
    console.error(`クライアント ${index + 1} 接続エラー: ${error.message}`);
  });
  
  // 各種データ受信イベント
  client.on('orderbook', (data) => {
    messageCount++;
  });
  
  client.on('kline', (data) => {
    messageCount++;
  });
  
  client.on('trade', (data) => {
    messageCount++;
  });
  
  return client;
}

// テストを実行
async function runTest() {
  console.log('WebSocketパフォーマンステストを開始します');
  console.log(`- サーバーURL: ${CONFIG.SERVER_URL}`);
  console.log(`- クライアント数: ${CONFIG.CLIENT_COUNT}`);
  console.log(`- テスト時間: ${CONFIG.TEST_DURATION / 1000}秒`);
  console.log(`- 測定間隔: ${CONFIG.MEASURE_INTERVAL / 1000}秒`);
  console.log(`- テスト対象シンボル: ${CONFIG.TEST_SYMBOLS.join(', ')}`);
  console.log(`- テスト対象チャネル: ${CONFIG.TEST_CHANNELS.join(', ')}`);
  console.log('-----------------------------------');
  
  // 開始時刻を記録
  results.startTimestamp = Date.now();
  
  // クライアントを作成
  for (let i = 0; i < CONFIG.CLIENT_COUNT; i++) {
    const client = createClient(i);
    clients.push(client);
    
    // クライアント作成の間隔を空ける（サーバー負荷軽減のため）
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // 定期的に測定
  const measureInterval = setInterval(measure, CONFIG.MEASURE_INTERVAL);
  
  // テスト終了時の処理
  setTimeout(() => {
    clearInterval(measureInterval);
    
    // 最後の測定
    measure();
    
    // 結果をまとめる
    results.endTime = new Date().toISOString();
    summarizeResults();
    
    // 結果を表示
    console.log('===== テスト結果サマリー =====');
    console.log(`テスト期間: ${results.startTime} ～ ${results.endTime}`);
    console.log(`クライアント数: ${CONFIG.CLIENT_COUNT}`);
    console.log(`平均CPU使用率: ${results.summary.avgCpuUsage.toFixed(2)}%`);
    console.log(`最大CPU使用率: ${results.summary.maxCpuUsage.toFixed(2)}%`);
    console.log(`平均メモリ使用量: ${results.summary.avgMemoryUsage.toFixed(2)}MB`);
    console.log(`最大メモリ使用量: ${results.summary.maxMemoryUsage.toFixed(2)}MB`);
    console.log(`総メッセージ数: ${results.summary.messageCount}`);
    console.log(`メッセージ/秒: ${results.summary.messagesPerSecond.toFixed(2)}`);
    console.log(`接続成功率: ${results.summary.connectSuccessRate.toFixed(2)}%`);
    console.log(`切断回数: ${results.summary.disconnectCount}`);
    console.log('=============================');
    
    // 結果を保存
    saveResults();
    
    // クライアントを切断
    for (const client of clients) {
      if (client.connected) {
        client.disconnect();
      }
    }
    
    console.log('テストが完了しました');
    process.exit(0);
  }, CONFIG.TEST_DURATION);
}

// テスト実行
runTest().catch(error => {
  console.error('テスト実行中にエラーが発生しました:', error);
  process.exit(1);
});