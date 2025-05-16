/**
 * シンボル（銘柄）関連の共通型定義
 * 
 * このファイルはシンボル（銘柄）関連の型定義を集約し、
 * market.ts、symbol.ts、store/app.tsなどでの重複を解消するために作成されました。
 * 全てのシンボル関連コンポーネントはこのファイルから型をインポートする必要があります。
 * 
 * v2.0: 型定義を services/symbol/types に移動し、ここからは再エクスポートのみ行います。
 */

// 共通型を再エクスポート
// 後方互換性のために services/symbol/types から型を再エクスポート
export type { SymbolInfo, SymbolChangeHistoryEntry, SymbolFilterOptions } from '@/types/symbol/common';

/**
 * 以下の型は後方互換性のために維持されますが、
 * 新しいコードでは @/services/symbol/types から直接インポートすることを推奨します。
 * 注意: 以前の SymbolFilterOptions は FilterOptions に統合されました。
 */

// シンボルリストコンポーネントのプロパティ型
export interface SymbolListProps {
  symbols: import('@/types/symbol/common').SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectSymbol?: (symbol: string) => void;
}

/**
 * Bitget取引所の銘柄情報APIレスポンス型
 * API固有の型定義なので、将来的にはnetwork/apiドメインに移動する可能性があります
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