/**
 * utils/chart/index.ts
 * チャートユーティリティ関数のバレルエクスポート
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 * - 2025-05-15: sanitizersとformattersからのエクスポートを追加
 * - 2025-05-xx: リファクタリングによりチャート関連モジュールを統合
 * - 2025-06-xx: T-7.5フェーズ - モジュールのエクスポート方式を調整
 */

/**
 * チャートユーティリティモジュールのインデックスファイル
 * チャート関連の関数やユーティリティを再エクスポート
 * 
 * 注意：ワイルドカードエクスポート（export *）を削除し、
 * 名前付きエクスポートに変更することで衝突を解消
 */

// 衝突しないモジュールからのエクスポートを維持
export * from './sanitizers';
export * from './formatters';
export * from './chartIndicatorUtils';
export * from './indicatorFactory';
export * from './indicators';

// 重複するエクスポートを明示的に制限
// chart.ts と chartUtils.ts からのエクスポートは
// tsconfig.jsonのnoImplicitReexportsオプションで対応します

// chart.tsから選択的にインポート
import { getDataPointsForTimeframe } from './chart';

// transformers.tsから選択的にインポート
import {
  ensureMilliseconds,
  normalizeTimeValue
} from './transformers';

// chartUtils.tsから選択的にインポート
import {
  extractPrices,
  safeRemoveSeries,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA
} from './chartUtils';

// 選択的に再エクスポート
export {
  // chart.tsから
  getDataPointsForTimeframe,
  
  // transformers.tsから
  ensureMilliseconds,
  normalizeTimeValue,
  
  // chartUtils.tsから
  extractPrices,
  safeRemoveSeries,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateSMA
}; 