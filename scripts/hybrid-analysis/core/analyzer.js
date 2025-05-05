// scripts/hybrid-analysis/core/analyzer.js
// ハイブリッド・マルチタイムフレーム分析のコアエンジン

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// ユーティリティモジュールをインポート
const { captureChart, closeSharedBrowser } = require('../utils/chart-capture');
const { createAPILimiter, createAnalysisPrompt, createCombinedAnalysisPrompt } = require('../utils/api-limiter');

// インジケーター計算用の関数をインポート
const { calculateIndicators } = require('./indicators');

// データ保存用のディレクトリ
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'public', 'hybrid-analysis');

/**
 * BitgetAPIからデータを取得
 * @param {string} symbol 通貨ペア
 * @param {string} timeframe タイムフレーム
 * @param {number} limit 取得件数
 * @returns {Promise<Object>} 取得したデータ
 */
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

/**
 * タイムフレームをBitget API形式に変換
 * @param {string} timeframe タイムフレーム
 * @returns {string} 変換後のフォーマット
 */
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

/**
 * デモデータを生成
 * @param {number} count 生成するデータの件数
 * @returns {Object} 生成したデータ
 */
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

/**
 * 複数のタイムフレームでハイブリッド分析を実行する（最適化版）
 * @param {string} symbol 通貨ペア
 * @param {Array<string>} timeframes 分析するタイムフレームの配列
 * @returns {Promise<Object>} 分析結果
 */
async function runOptimizedMultiTimeframeAnalysis(symbol = 'BTC/USDT', timeframes = ['15m', '1h', '4h', '1d']) {
  // データディレクトリの確認
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
      captureChart(symbol, tf, {
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
  // データディレクトリの確認
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
    const { chartImage, chartData } = await captureChart(symbol, timeframe, {
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

module.exports = {
  runOptimizedHybridAnalysis,
  runOptimizedMultiTimeframeAnalysis,
  getBitgetData,
  convertTimeframeFormat
};
