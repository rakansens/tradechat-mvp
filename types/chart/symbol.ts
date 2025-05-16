// types/chart/symbol.ts
// チャート用シンボル関連の型定義
// 更新: 共通モジュールからSymbolInfoをインポートするように変更

import { ExchangeType } from '../network/api';
import { SymbolInfo, SymbolListProps } from '../common/symbol';

// 共通型の再エクスポート
export type { SymbolInfo, SymbolListProps };

/**
 * チャート固有の拡張銘柄情報型（固有プロパティがある場合）
 */
export interface ChartSymbolInfo extends SymbolInfo {
  // チャート固有のプロパティがあれば追加
  hasHistoricalData?: boolean;
  supportedTimeframes?: string[];
}

/**
 * Bitget取引所の銘柄情報APIレスポンス型
 */
export interface BitgetSymbolsResponse {
  code: string;
  data: {
    symbol: string;
    baseCoin: string;
    quoteCoin: string;
    minTradeAmount: string;
    pricePrecision: string;
    quantityPrecision: string;
    status: string;
  }[];
  msg: string;
} 