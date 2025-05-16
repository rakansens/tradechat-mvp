/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/common/symbol.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/common/symbol からインポートすることを推奨します。
 */

// types/symbol.ts
// T-7フェーズで完全に削除予定のスタブファイル

import { ExchangeType } from './network/api';

// 共通モジュールからの型をエクスポート
export type { 
  SymbolInfo,
  SymbolFilterOptions,
  SymbolListProps,
  BitgetSymbolsResponse
} from './common/symbol';

// symbol/base.tsからの型をエクスポート
export type {
  LegacySymbolInfo,
  FilterOptions,
  SymbolChangeHistoryEntry,
  SymbolSliceState,
  toUISymbol,
  toCommonSymbol
} from './symbol/base';

// 以下の型定義は非推奨となりました。
// types/common/symbol.ts または types/symbol/base.ts から同等の型をインポートしてください。