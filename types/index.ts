// types/index.ts
// 更新: T-6フェーズ - 循環依存解消、共通型の参照先を統一

// アプリケーション全体で使用される型定義をエクスポート
// エクスポート順序は依存関係に基づいています（循環依存を防ぐため）

// まず共通モジュールをエクスポート（基本的な型定義）
export * from './common';  // 基本的な共通型を最初にエクスポート

// 次にドメイン固有の型をエクスポート（ドメイン間の依存関係に注意）
export * from './network'; // APIとネットワーク型をエクスポート
export * from './chart';   // チャート関連の型をエクスポート
export * from './ui';      // UI関連の型をエクスポート
export * from './indicators'; // インジケーター関連の型をエクスポート

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

// その他のドメイン型をエクスポート
export * from './chat';
export * from './entry';
export * from './symbol';

// 後方互換性のための非推奨ファイルからのエクスポート（T-7で削除予定）
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
