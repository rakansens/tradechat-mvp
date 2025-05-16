// types/chart/symbol.ts
// チャート用シンボル関連の型定義
// 更新: 共通モジュールからSymbolInfoをインポートするように変更
// 更新: T-6フェーズでBitgetSymbolsResponseを共通モジュールに移動

import { SymbolInfo, SymbolListProps, BitgetSymbolsResponse } from '../common/symbol';

// 共通型の再エクスポート
export type { SymbolInfo, SymbolListProps, BitgetSymbolsResponse };

/**
 * チャート固有の拡張銘柄情報型（固有プロパティがある場合）
 */
export interface ChartSymbolInfo extends SymbolInfo {
  // チャート固有のプロパティがあれば追加
  hasHistoricalData?: boolean;
  supportedTimeframes?: string[];
}

/**
 * チャート用シンボル情報と一般的なシンボル情報間の変換関数
 */
export function toChartSymbol(symbol: SymbolInfo): ChartSymbolInfo {
  return {
    ...symbol,
    hasHistoricalData: true, // デフォルト値または適切な判定ロジックを実装
    supportedTimeframes: ['1m', '5m', '15m', '1h', '4h', '1d'] // デフォルト値
  };
} 