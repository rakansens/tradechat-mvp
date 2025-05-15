// types/index.ts
// 更新: T-5フェーズ - 共通型の整理完了
// 更新: T-6フェーズ - 循環依存解消、共通型の参照先を統一

// ファイル間での型定義の重複があるため、選択的にエクスポートします
// 以下は最小限の互換性を維持するためのエクスポートです

// 基本的な型定義ファイル（重複を避けるため個別にエクスポート）
// T-3: api.ts, websocket.ts, external-libs.tsはnetworkドメインに移動
// T-4: chat.ts, entry.ts, ui.ts, symbol.tsはそれぞれのドメインに移動
// T-5: common.ts, common-interfaces.tsはcommonドメインに移動
export * from './indicators';

// ドメイン別の型定義（FilterOptions型の衝突を回避するため、store以外を先にエクスポート）
export * from './common';  // 共通型を最初にエクスポート
export * from './chart';
export * from './network';
export * from './ui';
export * from './chat';
export * from './entry';
export * from './symbol';

// storeドメインは明示的な型エクスポートを使用
export type {
  AppState,
  UIState,
  ChartDataState,
  ChartConfigState,
  IndicatorState,
  DrawingToolState,
  RealTimeState,
  MarketState,
  FilterOptions as StoreFilterOptions,  // 名前衝突を回避するために別名を使用
  IndicatorType,
  ActiveIndicator,
  DrawingToolType,
  TabType
} from './store';

// 後方互換性のための非推奨ファイルからのエクスポート
// T-4〜T-5フェーズで非推奨となったファイル
// これらは段階的に削除される予定です
// 注: 後方互換性のため、ファイル自体も維持されています
// export * from './chat';    // @deprecated - 循環依存のため削除
// export * from './entry';   // @deprecated - 循環依存のため削除
// export * from './ui';      // @deprecated - 循環依存のため削除
// export * from './symbol';  // @deprecated - 循環依存のため削除
// export * from './common';  // @deprecated - 上ですでにエクスポート済み
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

// 明示的にOrderBookEntryとOrderBookDataをcommon/orderbookからエクスポート
export type { OrderBookEntry, OrderBookData, OrderBookProps } from './common/orderbook';

// 明示的にSymbolInfoとSymbolFilterOptionsをcommon/symbolからエクスポート
export type { SymbolInfo, SymbolFilterOptions, SymbolListProps } from './common/symbol';

// symbol.tsのエクスポート
export type {
  SymbolChangeHistoryEntry, SymbolSliceState
} from './symbol';

// market.tsのエクスポート
export type {
  TradeDirection, TradeData, TradeListProps,
  MarketStatsData, MarketStatsProps,
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
