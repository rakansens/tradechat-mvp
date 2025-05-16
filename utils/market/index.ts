/**
 * マーケット関連のユーティリティモジュールのインデックスファイル
 * 価格、オーダーブック、取引関連の関数を再エクスポート
 * 
 * 変更履歴:
 * - T-7.5フェーズ: ワイルドカードエクスポートを個別エクスポートに変更し、循環参照を解消
 */

// 各モジュールからの選択的インポート
// price.tsからのインポート
import {
  formatPrice,
  calculateProfitPercentage as calcPriceProfit,
  calculatePriceChangePercentage,
  calculateBreakEvenPrice
} from './price';

// orderbook-utils.tsからのインポート
import {
  arrayToOrderBookEntry,
  orderBookEntryToArray,
  isArrayFormat,
  getPrice,
  getAmount,
  normalizeOrderBookData
} from './orderbook-utils';

// tradeUtils.tsからのインポート
import {
  calculateProfit,
  calculateProfitPercentage,
  calculateRiskRewardRatio,
  getStatusLabel,
  getSideLabel,
  formatEntryDate,
  calculateWinRate,
  calculateAverageProfitPercentage
} from './tradeUtils';

// 選択的に再エクスポート
export {
  // price.tsから
  formatPrice,
  calcPriceProfit,
  calculatePriceChangePercentage,
  calculateBreakEvenPrice,
  
  // orderbook-utils.tsから
  arrayToOrderBookEntry,
  orderBookEntryToArray,
  isArrayFormat,
  getPrice,
  getAmount,
  normalizeOrderBookData,
  
  // tradeUtils.tsから
  calculateProfit,
  calculateProfitPercentage,
  calculateRiskRewardRatio,
  getStatusLabel,
  getSideLabel,
  formatEntryDate,
  calculateWinRate,
  calculateAverageProfitPercentage
}; 