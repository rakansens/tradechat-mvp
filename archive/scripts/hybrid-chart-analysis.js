// scripts/hybrid-chart-analysis.js
// BitgetAPIからのデータとフロントエンドのチャートを組み合わせたハイブリッド分析スクリプト
// 作成: 2025-05-05

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const axios = require('axios');
const { technicalIndicators } = require('technicalindicators');

// OpenAI APIキー取得関数
const getOpenAIApiKey = () => {
  try {
    // .envファイルから直接読み込みを試みる
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/OPENAI_API_KEY=([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // 環境変数から取得を試みる
    if (process.env.OPENAI_API_KEY) {
      return process.env.OPENAI_API_KEY;
    }
    
    // プロジェクトの設定ファイルから取得を試みる
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.openaiApiKey) {
        return config.openaiApiKey;
      }
    }
    
    return null;
  } catch (error) {
    console.error('エラー: OpenAI APIキーの取得に失敗しました:', error);
    return null;
  }
};

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: getOpenAIApiKey()
});

// データ保存用のディレクトリ
const DATA_DIR = path.join(__dirname, '..', 'public', 'hybrid-analysis');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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
    console.error('BitgetAPIからのデータ取得に失敗しました:', error);
    
    // エラー時はダミーデータを生成
    console.log('デモデータを生成します...');
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

// フロントエンドのチャートをキャプチャ
async function captureChartPanel(symbol, timeframe) {
  console.log(`フロントエンドのチャートパネルをキャプチャ: ${symbol} (${timeframe})`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // アプリケーションのURLにアクセス（ローカル開発環境の場合）
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('アプリケーションページを読み込みました');
    
    // シンボルとタイムフレームを設定（UIの操作が必要な場合）
    // ここでは必要に応じてUIを操作してシンボルとタイムフレームを設定
    
    // チャートパネルが読み込まれるまで待機
    await page.waitForSelector('.chart-container', { timeout: 30000 });
    console.log('チャートコンテナを検出しました');
    
    // チャートパネルをキャプチャ
    const chartElement = await page.$('.chart-container');
    const chartImage = await chartElement.screenshot({ encoding: 'base64' });
    console.log('チャートのスクリーンショットを取得しました');
    
    // チャートデータをブラウザコンソールから取得
    const chartData = await page.evaluate(() => {
      // グローバル変数からチャートデータを取得（実際の実装に合わせて調整）
      return {
        // 注意: 実際のアプリケーションの構造に合わせて調整が必要
        candles: window.chartComponent?.getData?.() || [],
        indicators: {
          rsi: window.chartComponent?.getIndicatorData?.('rsi') || [],
          macd: window.chartComponent?.getIndicatorData?.('macd') || [],
          bollingerBands: window.chartComponent?.getIndicatorData?.('bb') || []
        },
        symbol: window.chartComponent?.getSymbol?.() || symbol,
        timeframe: window.chartComponent?.getTimeframe?.() || timeframe
      };
    });
    
    // ブラウザを閉じる
    await browser.close();
    
    return { chartImage, chartData };
  } catch (error) {
    console.error('チャートキャプチャ中にエラーが発生:', error);
    await browser.close();
    throw error;
  }
}

// ハイブリッド分析の実行
async function runHybridAnalysis(symbol = 'BTC/USDT', timeframe = '1d') {
  try {
    console.log(`ハイブリッド分析を開始: ${symbol} (${timeframe})`);
    
    // 1. BitgetAPIからデータを取得
    console.log('BitgetAPIからデータを取得中...');
    const apiData = await getBitgetData(symbol, timeframe);
    console.log(`取得完了: ${apiData.candles.length}件のキャンドルデータ`);
    
    // 2. フロントエンドのチャートをキャプチャ
    console.log('フロントエンドのチャートをキャプチャ中...');
    let chartImage, chartData;
    try {
      const result = await captureChartPanel(symbol, timeframe);
      chartImage = result.chartImage;
      chartData = result.chartData;
      console.log('チャートキャプチャ成功');
    } catch (error) {
      console.error('チャートキャプチャに失敗しました:', error);
      console.log('APIデータのみで分析を続行します');
      chartImage = null;
      chartData = { candles: [], indicators: {} };
    }
    
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
    
    // APIデータをテキスト形式に変換
    const apiDataText = JSON.stringify(analysisData, null, 2);
    
    // プロンプトを作成
    const systemPrompt = `あなたはトレーディングチャートとデータを分析する専門家AGENTです。
チャート画像と数値データの両方を分析して、以下の情報を含むレポートを作成してください：

1. 基本情報分析:
   - 通貨ペア/銘柄
   - 現在の価格レベル
   - チャートのタイムフレーム

2. テクニカル分析:
   - トレンド方向（上昇/下降/レンジ相場）
   - 主要なサポート/レジスタンスレベル
   - チャートパターン（三角形、ヘッドアンドショルダー等）
   - インジケーターの示唆（RSI, MACD, ボリンジャーバンド等）

3. ボリューム分析:
   - 取引量の傾向
   - 特筆すべきボリュームスパイク

4. トレード推奨:
   - エントリーポイントの提案（価格レベル）
   - 利確目標（複数のターゲット）
   - ストップロス推奨レベル
   - リスク/リワード比

5. 確信度評価:
   - 分析の確信度（低/中/高）
   - 考慮すべきリスク要因

6. 代替シナリオ:
   - 主要な見解が間違っていた場合の代替シナリオ
   - 警戒すべき価格レベル

レポートは簡潔かつ具体的な数値を含め、トレーダーが即座に行動できる情報を提供してください。
チャート画像とAPIデータの両方を考慮して、より正確な分析を行ってください。`;

    // OpenAI APIリクエストを作成
    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: [
          { 
            type: "text", 
            text: `このトレーディングチャートとAPIデータを分析し、トレード推奨を含む詳細なレポートを作成してください。

APIデータ:
${apiDataText}` 
          }
        ]
      }
    ];
    
    // 画像がある場合は追加
    if (chartImage) {
      messages[1].content.push({ 
        type: "image_url", 
        image_url: {
          url: `data:image/png;base64,${chartImage}`,
          detail: "high"
        }
      });
    }
    
    // OpenAI APIリクエスト実行
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 4000,
    });
    
    // レスポンスからテキストを抽出
    const analysis = response.choices[0]?.message.content || "";
    console.log('分析完了');
    
    // 6. 結果を保存
    const timestamp = Date.now();
    const resultPath = path.join(DATA_DIR, `hybrid-analysis-${symbol.replace('/', '')}-${timeframe}-${timestamp}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      symbol,
      timeframe,
      apiData: analysisData,
      analysis,
      imagePath: imagePath ? path.basename(imagePath) : null
    }, null, 2));
    
    // テキスト形式でも保存
    const textResultPath = path.join(DATA_DIR, `hybrid-analysis-${symbol.replace('/', '')}-${timeframe}-${timestamp}.txt`);
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
  
  if (!getOpenAIApiKey()) {
    console.error('エラー: OpenAI APIキーが設定されていません。');
    process.exit(1);
  }
  
  try {
    console.log(`ハイブリッド分析を開始: ${symbol} (${timeframe})`);
    const result = await runHybridAnalysis(symbol, timeframe);
    
    if (result.success) {
      console.log('ハイブリッド分析が成功しました');
      console.log('\n===== 分析結果 =====\n');
      console.log(result.analysis);
    } else {
      console.error('ハイブリッド分析に失敗しました:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('予期せぬエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
