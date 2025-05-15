// types/index.ts
// 更新: T-5フェーズ - 共通型の整理完了

// ファイル間での型定義の重複があるため、選択的にエクスポートします
// 以下は最小限の互換性を維持するためのエクスポートです

// 基本的な型定義ファイル（重複を避けるため個別にエクスポート）
// T-3: api.ts, websocket.ts, external-libs.tsはnetworkドメインに移動
// T-4: chat.ts, entry.ts, ui.ts, symbol.tsはそれぞれのドメインに移動
// T-5: common.ts, common-interfaces.tsはcommonドメインに移動
export * from './indicators';

// ドメイン別の型定義
export * from './chart';   // T-1フェーズで実装
export * from './store';   // T-2フェーズで実装
export * from './network'; // T-3フェーズで実装
export * from './ui';      // T-4フェーズで実装
export * from './chat';    // T-4フェーズで実装
export * from './entry';   // T-4フェーズで実装
export * from './symbol';  // T-4フェーズで実装
export * from './common';  // T-5フェーズで実装

// 後方互換性のための非推奨ファイルからのエクスポート
// T-4〜T-5フェーズで非推奨となったファイル
// これらは段階的に削除される予定です
// 注: 後方互換性のため、ファイル自体も維持されています
export * from './chat';    // @deprecated
export * from './entry';   // @deprecated
export * from './ui';      // @deprecated
export * from './symbol';  // @deprecated
export * from './common';  // @deprecated
export * from './common-interfaces'; // @deprecated

// 型の重複があるファイルは個別にエクスポート
// chart.tsのエクスポート
export type {
  Nominal, UTCTimestamp, BusinessDay, Time, ChartTimeCompatible,
  Timeframe, ChartType, OHLCData, OHLCDataSchema, TimeframeSchema,
  ChartDataStateSchema, ChartMarker, ChartOptions, TechnicalIndicator,
  IchimokuOptions, FibonacciDirection, FibonacciOptions,
  ChartState
} from './chart';

// 明示的にOrderBookEntryとOrderBookDataをエクスポート
export type { OrderBookEntry, OrderBookData } from './chart';

// store.tsのエクスポート
export * from './store';

// symbol.tsのエクスポート（FilterOptionsとSymbolInfoの重複を解決）
export type {
  SymbolInfo, SymbolFilterOptions, FilterOptions, 
  SymbolChangeHistoryEntry, SymbolSliceState
} from './symbol';

// market.tsのエクスポート（OrderBookEntryとOrderBookData、SymbolInfoの重複を解決）
export type {
  TradeDirection, TradeData, TradeListProps,
  MarketStatsData, MarketStatsProps, OrderBookProps,
  BitgetOrderBookResponse, BitgetTradesResponse,
  BitgetTickerResponse, BitgetSymbolsResponse
} from './market';

// global.d.tsはグローバル宣言ファイルのため、明示的にはエクスポートしません
// 注: mastra.d.tsも同様です

// 以下は将来的な構造 (T-6のリファクタリング後)
/*
// 各ドメイン別の型をエクスポート
export * from './chart';
export * from './store';
export * from './network';
export * from './ui';
export * from './chat';
export * from './entry';
export * from './symbol';
export * from './common';
*/

// Supabase Database型のエクスポート
export type { Database } from './supabase';
