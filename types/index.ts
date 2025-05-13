// types/index.ts
// 更新: T-0フェーズ - 型定義ファイルの再構成準備

// ファイル間での型定義の重複があるため、選択的にエクスポートします
// 以下は最小限の互換性を維持するためのエクスポートです

// 基本的な型定義ファイル（重複を避けるため個別にエクスポート）
export * from './api';
export * from './chat';
export * from './common';
export * from './common-interfaces';
export * from './entry';
export * from './external-libs';
export * from './indicators';
export * from './ui';
export * from './websocket';

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

// 以下は将来的な構造 (T-1〜T-6のリファクタリング後)
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
