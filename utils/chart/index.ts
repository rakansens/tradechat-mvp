/**
 * utils/chart/index.ts
 * チャートユーティリティ関数のバレルエクスポート
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 * - 2025-05-15: sanitizersとformattersからのエクスポートを追加
 * - 2025-05-xx: リファクタリングによりチャート関連モジュールを統合
 * - 2025-06-xx: T-7.5フェーズ - モジュールのエクスポート方式を調整
 * - 2025-06-xx: T-7.5フェーズ - ワイルドカードエクスポートを個別エクスポートに変更して循環参照を解消
 */

/**
 * チャートユーティリティモジュールのインデックスファイル
 * チャート関連の関数やユーティリティを再エクスポート
 * 
 * 注意：ワイルドカードエクスポート（export *）を削除し、
 * 名前付きエクスポートに変更することで衝突を解消
 */

// sanitizers.tsから選択的にインポート
import {
  validateTimeOrder,
  sanitizeOHLCData,
  generateDefaultChartData
} from './sanitizers';

// formatters.tsから選択的にインポート
import {
  formatCandlestickData,
  formatLineData,
  getMAPeriodForTimeframe,
  createEntryMarkers,
  createExitMarkers
} from './formatters';

// chartIndicatorUtils.tsからインポート
import {
  filterValidData,
  createCompatibleSeries,
  safeRemoveSeries,
  removeIndicatorSeries,
  extractPrices,
  convertToLineData,
  sortAndPrepareData,
  convertLineData,
  convertHistogramData,
  convertAreaData
} from './chartIndicatorUtils';

// chart.tsから選択的にインポート
import { getDataPointsForTimeframe } from './chart';

// transformers.tsから選択的にインポート
import {
  ensureMilliseconds,
  normalizeTimeValue
} from './transformers';

// chartUtils.tsから選択的にインポート
import {
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA
} from './chartUtils';

// すべての関数を選択的に再エクスポート
export {
  // sanitizers.tsから
  validateTimeOrder,
  sanitizeOHLCData,
  generateDefaultChartData,
  
  // formatters.tsから
  formatCandlestickData,
  formatLineData,
  getMAPeriodForTimeframe,
  createEntryMarkers,
  createExitMarkers,
  
  // chartIndicatorUtils.tsから
  filterValidData,
  createCompatibleSeries,
  safeRemoveSeries,
  removeIndicatorSeries,
  extractPrices,
  convertToLineData,
  sortAndPrepareData,
  convertLineData,
  convertHistogramData,
  convertAreaData,
  
  // chart.tsから
  getDataPointsForTimeframe,
  
  // transformers.tsから
  ensureMilliseconds,
  normalizeTimeValue,
  
  // chartUtils.tsから
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA
}; 