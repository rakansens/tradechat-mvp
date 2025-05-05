// scripts/hybrid-analysis/core/indicators.js
// テクニカルインジケーターの計算を行うユーティリティ

/**
 * RSI（Relative Strength Index）を計算
 * @param {Array} candles キャンドルデータ配列
 * @param {number} period RSIの期間（通常14）
 * @returns {Array} RSI値の配列
 */
function calculateRSI(candles, period = 14) {
  if (candles.length < period + 1) {
    return Array(candles.length).fill(null);
  }

  const rsi = Array(candles.length).fill(null);
  let gains = 0;
  let losses = 0;

  // 初期平均ゲイン/ロスを計算
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  // 最初のRSI値を計算
  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  rsi[period] = 100 - (100 / (1 + rs));

  // 残りのRSI値を計算
  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
    rs = avgLoss > 0 ? avgGain / avgLoss : 100;
    rsi[i] = 100 - (100 / (1 + rs));
  }

  return rsi;
}

/**
 * 移動平均（Simple Moving Average）を計算
 * @param {Array} data データ配列
 * @param {number} period 期間
 * @returns {Array} 移動平均値の配列
 */
function calculateSMA(data, period) {
  const sma = Array(data.length).fill(null);
  if (data.length < period) {
    return sma;
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  sma[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period] + data[i];
    sma[i] = sum / period;
  }

  return sma;
}

/**
 * 指数移動平均（Exponential Moving Average）を計算
 * @param {Array} data データ配列
 * @param {number} period 期間
 * @returns {Array} EMA値の配列
 */
function calculateEMA(data, period) {
  const ema = Array(data.length).fill(null);
  if (data.length < period) {
    return ema;
  }

  // 最初のEMAはSMAとして計算
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema[period - 1] = sum / period;

  // 残りのEMAを計算
  const multiplier = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    ema[i] = data[i] * multiplier + ema[i - 1] * (1 - multiplier);
  }

  return ema;
}

/**
 * MACD（Moving Average Convergence Divergence）を計算
 * @param {Array} candles キャンドルデータ配列
 * @param {Object} params MACD計算パラメータ
 * @returns {Object} MACD、シグナル、ヒストグラム値の配列
 */
function calculateMACD(candles, params = { fast: 12, slow: 26, signal: 9 }) {
  const { fast, slow, signal } = params;
  const closes = candles.map(candle => candle.close);
  
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);
  
  const macdLine = Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine[i] = fastEMA[i] - slowEMA[i];
    }
  }
  
  const signalLine = calculateEMA(macdLine.filter(val => val !== null), signal);
  
  // シグナルラインを同じ長さに戻す
  const fullSignalLine = Array(candles.length).fill(null);
  let signalIndex = 0;
  for (let i = 0; i < candles.length; i++) {
    if (macdLine[i] !== null) {
      if (signalIndex < signalLine.length) {
        fullSignalLine[i] = signalLine[signalIndex++];
      }
    }
  }
  
  // ヒストグラムを計算
  const histogram = Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (macdLine[i] !== null && fullSignalLine[i] !== null) {
      histogram[i] = macdLine[i] - fullSignalLine[i];
    }
  }
  
  return { macd: macdLine, signal: fullSignalLine, histogram };
}

/**
 * ボリンジャーバンドを計算
 * @param {Array} candles キャンドルデータ配列
 * @param {Object} params ボリンジャーバンド計算パラメータ
 * @returns {Object} 上部、中央、下部バンド値の配列
 */
function calculateBollingerBands(candles, params = { period: 20, stdDev: 2 }) {
  const { period, stdDev } = params;
  const closes = candles.map(candle => candle.close);
  
  // 中央バンド（SMA）
  const middle = calculateSMA(closes, period);
  
  const upper = Array(candles.length).fill(null);
  const lower = Array(candles.length).fill(null);
  
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += Math.pow(closes[i - j] - middle[i], 2);
    }
    const stdDeviation = Math.sqrt(sum / period);
    
    upper[i] = middle[i] + (stdDev * stdDeviation);
    lower[i] = middle[i] - (stdDev * stdDeviation);
  }
  
  return { upper, middle, lower };
}

/**
 * 各種インジケーターを計算して返す
 * @param {Array} candles キャンドルデータ配列
 * @returns {Object} 各インジケーターの計算結果
 */
function calculateIndicators(candles) {
  if (!candles || candles.length === 0) {
    return {};
  }
  
  const closes = candles.map(candle => candle.close);
  
  return {
    // RSI
    rsi: {
      values: calculateRSI(candles, 14),
      period: 14,
      overbought: 70,
      oversold: 30
    },
    
    // MACD
    macd: calculateMACD(candles),
    
    // ボリンジャーバンド
    bollingerBands: calculateBollingerBands(candles),
    
    // 移動平均線
    ma: {
      ma20: calculateSMA(closes, 20),
      ma50: calculateSMA(closes, 50),
      ma100: calculateSMA(closes, 100),
      ma200: calculateSMA(closes, 200)
    },
    
    // ATR（Average True Range）は複雑なので省略
    
    // 最新の価格情報
    lastPrice: candles.length > 0 ? candles[candles.length - 1].close : null,
    
    // 価格変動情報（過去24時間）
    priceChange: candles.length > 1 ? {
      absolute: candles[candles.length - 1].close - candles[candles.length - 2].close,
      percentage: ((candles[candles.length - 1].close - candles[candles.length - 2].close) / candles[candles.length - 2].close) * 100
    } : null
  };
}

module.exports = {
  calculateIndicators,
  calculateRSI,
  calculateSMA,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands
};
