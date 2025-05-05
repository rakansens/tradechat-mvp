// scripts/optimized-hybrid-analysis.js
// 最適化されたハイブリッドチャート分析スクリプト
// - ブラウザインスタンスの共有
// - API並列リクエスト制限
// - メモリ使用量の最適化

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 最適化された独自モジュールをインポート
const { captureChartOptimized, closeSharedBrowser } = require('./optimized-chart-capture');
const { 
  createAPILimiter, 
  createAnalysisPrompt, 
  createCombinedAnalysisPrompt 
} = require('./optimized-api-limiter');

// BitgetAPIからデータを取得
async function getBitgetData(symbol, timeframe, limit = 100) {
  console.log(`BitgetAPIからデータを取得: ${symbol} (${timeframe})`);
  
  try {
    // シンボルフォーマットを調整（BTC/USDTをBTCUSDTに変換）
    const formattedSymbol = symbol.replace('/', '');
    
    // APIエンドポイントとパラメータを設定
    const url = 'https://api.bitget.com/api/v2/spot/market/candles';
    const params = {
      symbol: formattedSymbol,
      granularity: convertTimeframeFormat(timeframe),
      limit: limit
    };
    
    // APIリクエスト
    const response = await axios.get(url, { params });
    
    // レスポンスデータを確認
    if (!response.data || !response.data.data) {
      throw new Error('APIからのレスポンスが不正です');
    }
    
    // キャンドルデータを正規化
    const candles = response.data.data.map(candle => {
      // Bitget APIのレスポンス形式: [timestamp, open, high, low, close, volume, ...]
      return {
        time: parseInt(candle[0]), // タイムスタンプ
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5] || 0)
      };
    });
    
    // インジケーターを計算
    const indicators = calculateIndicators(candles);
    
    return { candles, indicators };
  } catch (error) {
    console.error(`BitgetAPIからのデータ取得に失敗しました (${timeframe}):`, error);
    
    // エラー時はダミーデータを生成
    console.log(`${timeframe}: デモデータを生成します...`);
    return generateDemoData(limit);
  }
}

// タイムフレームをBitget API形式に変換
function convertTimeframeFormat(timeframe) {
  const mapping = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1h',
    '4h': '4h',
    '6h': '6h',
    '12h': '12h',
    '1d': '1day',
    '1w': '1week'
  };
  
  return mapping[timeframe] || '1day'; // デフォルトは1日
}

// デモデータを生成
function generateDemoData(count) {
  const candles = [];
  const basePrice = 50000 + Math.random() * 10000;
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    const time = now - (count - i) * 86400000; // 1日ごと
    const open = basePrice * (1 + (Math.random() * 0.1 - 0.05));
    const close = open * (1 + (Math.random() * 0.1 - 0.05));
    const high = Math.max(open, close) * (1 + Math.random() * 0.03);
    const low = Math.min(open, close) * (1 - Math.random() * 0.03);
    const volume = Math.random() * 1000 + 500;
    
    candles.push({ time, open, high, low, close, volume });
  }
  
  // インジケーターを計算
  const indicators = calculateIndicators(candles);
  
  return { candles, indicators };
}

// テクニカルインジケーターを計算
function calculateIndicators(candles) {
  // データを抽出
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);
  
  // RSI（相対力指数）
  const rsi = calculateRSI(closes, 14);
  
  // MACD（移動平均収束拡散法）
  const macd = calculateMACD(closes);
  
  // ボリンジャーバンド
  const bb = calculateBollingerBands(closes);
  
  // 移動平均線
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  
  return {
    rsi,
    macd,
    bb,
    sma: {
      sma20,
      sma50,
      sma200
    }
  };
}

// RSI計算
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) {
    return Array(prices.length).fill(null);
  }
  
  const rsi = [];
  let gains = 0;
  let losses = 0;
  
  // 最初のRSI値を計算
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }
  
  // 平均の計算
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // 最初の期間はnullで埋める
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }
  
  // 最初のRSI値を計算
  let rs = avgGain / avgLoss;
  rsi.push(100 - (100 / (1 + rs)));
  
  // 残りのRSI値を計算
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    let currentGain = 0;
    let currentLoss = 0;
    
    if (change >= 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }
    
    // スムージング
    avgGain = ((avgGain * (period - 1)) + currentGain) / period;
    avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    
    rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  
  return rsi;
}

// SMA計算
function calculateSMA(prices, period) {
  const result = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += prices[i - j];
    }
    result.push(sum / period);
  }
  
  return result;
}

// EMA計算
function calculateEMA(prices, period) {
  const result = [];
  const multiplier = 2 / (period + 1);
  
  // 最初のEMAは単純移動平均（SMA）として計算
  let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    
    if (i === period - 1) {
      result.push(ema);
      continue;
    }
    
    ema = (prices[i] - ema) * multiplier + ema;
    result.push(ema);
  }
  
  return result;
}

// MACD計算
function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  const macdLine = [];
  for (let i = 0; i < prices.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }
  }
  
  const signalLine = calculateEMA(macdLine.filter(v => v !== null), signalPeriod);
  
  // signalLineの長さをmacdLineに合わせる
  const paddedSignalLine = Array(prices.length - signalLine.length).fill(null).concat(signalLine);
  
  const histogram = [];
  for (let i = 0; i < prices.length; i++) {
    if (macdLine[i] === null || paddedSignalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i] - paddedSignalLine[i]);
    }
  }
  
  return {
    macd: macdLine,
    signal: paddedSignalLine,
    histogram: histogram
  };
}

// ボリンジャーバンド計算
function calculateBollingerBands(prices, period = 20, multiplier = 2) {
  const middle = calculateSMA(prices, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(prices[i - j] - middle[i], 2);
    }
    const stdDev = Math.sqrt(sum / period);
    
    upper.push(middle[i] + (multiplier * stdDev));
    lower.push(middle[i] - (multiplier * stdDev));
  }
  
  return {
    upper,
    middle,
    lower
  };
}

/**
 * 複数のタイムフレームでハイブリッド分析を実行する（最適化版）
 * @param {string} symbol 通貨ペア
 * @param {Array<string>} timeframes 分析するタイムフレームの配列
 * @returns {Promise<Object>} 分析結果
 */
async function runOptimizedMultiTimeframeAnalysis(symbol = 'BTC/USDT', timeframes = ['15m', '1h', '4h', '1d']) {
  // データ保存用のディレクトリ
  const DATA_DIR = path.join(__dirname, '..', 'public', 'hybrid-analysis');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  try {
    console.log(`複数タイムフレーム最適化分析を開始: ${symbol} (${timeframes.join(', ')})`);
    
    // 結果を保存するオブジェクト
    const results = {};
    const allIndicatorsData = {};
    
    // API並列リクエスト制限を設定（同時に2リクエストまで）
    const limitedAPIRequest = createAPILimiter(2);
    
    // 各タイムフレームを非同期に処理するが、BitgetAPIとキャプチャは先に完了させる
    console.log('1. 全タイムフレームのデータ取得とキャプチャをバッチ処理中...');
    
    // 1-a. すべてのタイムフレームのBitgetAPIデータを取得
    const apiDataPromises = timeframes.map(tf => getBitgetData(symbol, tf));
    const apiDataResults = await Promise.all(apiDataPromises);
    
    // apiDataResultsをtimeframesと紐付ける
    const apiDataMap = {};
    timeframes.forEach((tf, index) => {
      apiDataMap[tf] = apiDataResults[index];
      allIndicatorsData[tf] = apiDataResults[index].indicators;
    });
    
    console.log('BitgetAPIデータの取得完了');
    
    // 1-b. すべてのタイムフレームのチャートキャプチャを同一ブラウザインスタンスで実行
    const capturePromises = timeframes.map(tf => 
      captureChartOptimized(symbol, tf, {
        url: 'http://localhost:3000'
      })
    );
    const captureResults = await Promise.all(capturePromises);
    
    // captureResultsをtimeframesと紐付ける
    const captureMap = {};
    timeframes.forEach((tf, index) => {
      captureMap[tf] = captureResults[index];
    });
    
    console.log('チャートキャプチャの完了');
    
    // ブラウザの共有インスタンスを閉じる（すべてのキャプチャ完了後）
    await closeSharedBrowser();
    
    // 2. 各タイムフレームでの分析準備と実行
    console.log('2. 各タイムフレームの分析と結果保存をバッチ処理中...');
    
    // タイムフレームごとの分析を実行する関数
    async function processTimeframeAnalysis(tf) {
      console.log(`タイムフレーム ${tf} の分析を開始...`);
      
      const apiData = apiDataMap[tf];
      const { chartImage, chartData } = captureMap[tf];
      
      // チャート画像を保存
      let imagePath = null;
      if (chartImage) {
        imagePath = path.join(DATA_DIR, `chart-${symbol.replace('/', '')}-${tf}-${Date.now()}.png`);
        fs.writeFileSync(imagePath, Buffer.from(chartImage, 'base64'));
        console.log(`チャート画像を保存: ${imagePath}`);
      }
      
      // 分析用のデータを準備
      const analysisData = {
        symbol,
        timeframe: tf,
        timestamp: new Date().toISOString(),
        apiData: {
          latestCandles: apiData.candles.slice(-10), // 最新の10本のローソク足
          indicators: apiData.indicators
        },
        chartData: chartData.candles.length > 0 ? {
          frontendCandles: chartData.candles.slice(-10),
          frontendIndicators: chartData.indicators
        } : null
      };
      
      // OpenAI APIでの分析 - 制限付き並列処理
      console.log(`GPT-4oモデルでデータと画像を分析中... (${tf})`);
      
      // APIプロンプトを作成
      const messages = createAnalysisPrompt(tf, analysisData, chartImage);
      
      // OpenAI API実行（リミッター付き）
      const response = await limitedAPIRequest({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 4000,
      }, `タイムフレーム${tf}分析`);
      
      // レスポンスからテキストを抽出
      const analysis = response.choices[0]?.message.content || "";
      console.log(`タイムフレーム ${tf} の分析完了`);
      
      // 結果を保存
      const timestamp = Date.now();
      const resultPath = path.join(DATA_DIR, `analysis-${symbol.replace('/', '')}-${tf}-${timestamp}.json`);
      fs.writeFileSync(resultPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        symbol,
        timeframe: tf,
        apiData: analysisData,
        analysis,
        imagePath: imagePath ? path.basename(imagePath) : null
      }, null, 2));
      
      // テキスト形式でも保存
      const textResultPath = path.join(DATA_DIR, `analysis-${symbol.replace('/', '')}-${tf}-${timestamp}.txt`);
      fs.writeFileSync(textResultPath, `
===========================================
TRADING ANALYSIS REPORT - ${tf}
===========================================
Date: ${new Date().toISOString()}
Symbol: ${symbol}
Timeframe: ${tf}

===========================================
ANALYSIS:
===========================================

${analysis}

===========================================
`);
      
      console.log(`タイムフレーム ${tf} の分析結果を保存: ${resultPath}`);
      
      // 結果を返す
      return {
        timeframe: tf,
        analysis,
        imagePath,
        resultPath,
        textResultPath
      };
    }
    
    // 各タイムフレームの分析を制限付き並列処理（APIリクエスト制限に合わせる）
    const analysisTasks = timeframes.map(tf => processTimeframeAnalysis(tf));
    const analysisResults = await Promise.all(analysisTasks);
    
    // 結果を整理
    analysisResults.forEach(result => {
      results[result.timeframe] = {
        analysis: result.analysis,
        imagePath: result.imagePath,
        resultPath: result.resultPath,
        textResultPath: result.textResultPath
      };
    });
    
    console.log('全タイムフレームの分析が完了しました');
    
    // 3. 複数タイムフレームの総合分析
    console.log('\n===== 複数タイムフレームの総合分析を開始 =====\n');
    
    // 総合分析用のプロンプトとパラメータを準備
    const combinedMessages = createCombinedAnalysisPrompt(symbol, timeframes, results);
    
    // 総合分析のOpenAI APIリクエスト実行
    const combinedResponse = await limitedAPIRequest({
      model: "gpt-4o",
      messages: combinedMessages,
      max_tokens: 4000,
    }, "タイムフレーム総合分析");
    
    // 総合分析結果
    const combinedAnalysis = combinedResponse.choices[0]?.message.content || "";
    console.log('複数タイムフレームの総合分析完了');
    
    // 総合分析結果を保存
    const timestamp = Date.now();
    const combinedResultPath = path.join(DATA_DIR, `combined-analysis-${symbol.replace('/', '')}-${timestamp}.json`);
    fs.writeFileSync(combinedResultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      symbol,
      timeframes,
      combinedAnalysis,
      timeframeResults: results
    }, null, 2));
    
    // テキスト形式でも保存
    const combinedTextResultPath = path.join(DATA_DIR, `combined-analysis-${symbol.replace('/', '')}-${timestamp}.txt`);
    fs.writeFileSync(combinedTextResultPath, `
===========================================
MULTI-TIMEFRAME TRADING ANALYSIS REPORT
===========================================
Date: ${new Date().toISOString()}
Symbol: ${symbol}
Timeframes: ${timeframes.join(', ')}

===========================================
COMBINED ANALYSIS:
===========================================

${combinedAnalysis}

===========================================
`);
    
    console.log(`総合分析結果を保存: ${combinedResultPath}`);
    
    return {
      success: true,
      timeframeResults: results,
      combinedAnalysis,
      combinedResultPath,
      combinedTextResultPath
    };
  } catch (error) {
    console.error('複数タイムフレーム分析中にエラーが発生:', error);
    
    // ブラウザが残っている場合は閉じる
    try {
      await closeSharedBrowser();
    } catch (e) {
      console.error('ブラウザクローズ中にエラー:', e);
    }
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * 単一のタイムフレームでハイブリッド分析を実行する（最適化版）
 * @param {string} symbol 通貨ペア
 * @param {string} timeframe タイムフレーム
 * @returns {Promise<Object>} 分析結果
 */
async function runOptimizedHybridAnalysis(symbol = 'BTC/USDT', timeframe = '1d') {
  // データ保存用のディレクトリ
  const DATA_DIR = path.join(__dirname, '..', 'public', 'hybrid-analysis');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  try {
    console.log(`最適化ハイブリッド分析を開始: ${symbol} (${timeframe})`);
    
    // API並列リクエスト制限を設定
    const limitedAPIRequest = createAPILimiter(1);
    
    // 1. BitgetAPIからデータを取得
    console.log('BitgetAPIからデータを取得中...');
    const apiData = await getBitgetData(symbol, timeframe);
    console.log(`取得完了: ${apiData.candles.length}件のキャンドルデータ`);
    
    // 2. フロントエンドのチャートをキャプチャ
    console.log('フロントエンドのチャートをキャプチャ中...');
    const { chartImage, chartData } = await captureChartOptimized(symbol, timeframe, {
      url: 'http://localhost:3000'
    });
    console.log('チャートキャプチャ完了');
    
    // ブラウザを閉じる
    await closeSharedBrowser();
    
    // 3. 画像をファイルに保存（キャプチャ成功時のみ）
    let imagePath = null;
    if (chartImage) {
      imagePath = path.join(DATA_DIR, `chart-${symbol.replace('/', '')}-${timeframe}-${Date.now()}.png`);
      fs.writeFileSync(imagePath, Buffer.from(chartImage, 'base64'));
      console.log(`チャート画像を保存: ${imagePath}`);
    }
    
    // 4. 分析用のデータを準備
    const analysisData = {
      symbol,
      timeframe,
      timestamp: new Date().toISOString(),
      apiData: {
        latestCandles: apiData.candles.slice(-10), // 最新の10本のローソク足
        indicators: apiData.indicators
      },
      chartData: chartData.candles.length > 0 ? {
        frontendCandles: chartData.candles.slice(-10),
        frontendIndicators: chartData.indicators
      } : null
    };
    
    // 5. OpenAI APIで分析
    console.log('GPT-4oモデルでデータと画像を分析中...');
    
    // APIリクエストのメッセージを準備
    const messages = createAnalysisPrompt(timeframe, analysisData, chartImage);
    
    // OpenAI APIリクエストを実行（制限付き）
    const response = await limitedAPIRequest({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 4000,
    }, "単一タイムフレーム分析");
    
    // レスポンスからテキストを抽出
    const analysis = response.choices[0]?.message.content || "";
    console.log('分析完了');
    
    // 6. 結果を保存
    const resultPath = path.join(DATA_DIR, `hybrid-analysis-${symbol.replace('/', '')}-${timeframe}-${Date.now()}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      symbol,
      timeframe,
      apiData: analysisData,
      analysis,
      imagePath: imagePath ? path.basename(imagePath) : null
    }, null, 2));
    
    // テキスト形式でも保存
    const textResultPath = path.join(DATA_DIR, `hybrid-analysis-${symbol.replace('/', '')}-${timeframe}-${Date.now()}.txt`);
    fs.writeFileSync(textResultPath, `
===========================================
HYBRID TRADING ANALYSIS REPORT
===========================================
Date: ${new Date().toISOString()}
Symbol: ${symbol}
Timeframe: ${timeframe}

===========================================
ANALYSIS:
===========================================

${analysis}

===========================================
`);
    
    console.log(`分析結果を保存: ${resultPath}`);
    console.log(`テキストレポートを保存: ${textResultPath}`);
    
    return {
      success: true,
      apiData: analysisData,
      analysis,
      imagePath,
      resultPath,
      textResultPath
    };
  } catch (error) {
    console.error('ハイブリッド分析中にエラーが発生:', error);
    
    // ブラウザが残っている場合は閉じる
    try {
      await closeSharedBrowser();
    } catch (e) {
      console.error('ブラウザクローズ中にエラー:', e);
    }
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

// メイン実行関数
async function main() {
  const symbol = process.argv[2] || 'BTC/USDT';
  const timeframe = process.argv[3] || '1d';
  const multiTimeframe = process.argv[4] === 'multi' || false;
  
  try {
    // メモリ使用量のログ出力
    const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
    const memoryData = process.memoryUsage();
    
    console.log('初期メモリ使用量:');
    console.log(`- RSS: ${formatMemoryUsage(memoryData.rss)}`);
    console.log(`- Heap Total: ${formatMemoryUsage(memoryData.heapTotal)}`);
    console.log(`- Heap Used: ${formatMemoryUsage(memoryData.heapUsed)}`);
    console.log(`- External: ${formatMemoryUsage(memoryData.external)}`);
    
    if (multiTimeframe) {
      console.log(`複数タイムフレーム最適化分析を開始: ${symbol}`);
      const timeframes = ['15m', '1h', '4h', '1d'];
      const result = await runOptimizedMultiTimeframeAnalysis(symbol, timeframes);
      
      if (result.success) {
        console.log('複数タイムフレーム分析が成功しました');
        console.log('\n===== 総合分析結果 =====\n');
        console.log(result.combinedAnalysis);
      } else {
        console.error('複数タイムフレーム分析に失敗しました:', result.error);
        process.exit(1);
      }
    } else {
      console.log(`単一タイムフレーム最適化分析を開始: ${symbol} (${timeframe})`);
      const result = await runOptimizedHybridAnalysis(symbol, timeframe);
      
      if (result.success) {
        console.log('ハイブリッド分析が成功しました');
        console.log('\n===== 分析結果 =====\n');
        console.log(result.analysis);
      } else {
        console.error('ハイブリッド分析に失敗しました:', result.error);
        process.exit(1);
      }
    }
    
    // 最終メモリ使用量
    const finalMemoryData = process.memoryUsage();
    console.log('\n最終メモリ使用量:');
    console.log(`- RSS: ${formatMemoryUsage(finalMemoryData.rss)}`);
    console.log(`- Heap Total: ${formatMemoryUsage(finalMemoryData.heapTotal)}`);
    console.log(`- Heap Used: ${formatMemoryUsage(finalMemoryData.heapUsed)}`);
    console.log(`- External: ${formatMemoryUsage(finalMemoryData.external)}`);
    
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
