/**
 * ポジション関連のユーティリティモジュールのインデックスファイル
 * ポジション計算や管理関連の関数を再エクスポート
 * 更新: T-7.6フェーズ - ワイルドカードエクスポートを避け、名前付きエクスポートを使用して衝突解消
 */

// position.tsからのインポート
import {
  calculateProfit,
  calculateProfitPercentage,
  calculateRiskRewardRatio,
  getStatusLabel
} from './position';

// positionUtils.tsからのインポート - 重複する関数名をエイリアス
import {
  formatDate as formatEntryDate,
  calculateProfit as calculateProfitLegacy,
  calculateProfitPercentage as calculateProfitPercentageLegacy
} from './positionUtils';

// すべての関数を名前付きで再エクスポート
export {
  // position.tsから
  calculateProfit,
  calculateProfitPercentage,
  calculateRiskRewardRatio,
  getStatusLabel,

  // positionUtils.tsから - エイリアス付き
  formatEntryDate,
  calculateProfitLegacy,
  calculateProfitPercentageLegacy
}; 