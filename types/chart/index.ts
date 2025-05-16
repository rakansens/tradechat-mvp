/**
 * チャート関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはT-1フェーズでtypes/chart.ts, types/indicators.ts, types/market.tsの
 * 型がチャートドメイン関連ファイルに移動されました。
 * T-6フェーズで循環依存を防ぐためにエクスポート方法を最適化しました。
 */

// 直接サブモジュールの型定義をエクスポート
export type { OHLCData, ChartState } from './data';
// バンドルに必要な時間関連型のエクスポート
export type { Nominal, UTCTimestamp, BusinessDay, Time, ChartTimeCompatible } from './time';
// インジケーター関連の型
export type { ChartIndicator } from './indicators';

// 共通モジュールからのエクスポートはタイプセーフに行う
export type { OrderBookEntry, OrderBookData, OrderBookProps } from '../common/orderbook';
export type { SymbolInfo, SymbolListProps } from '../common/symbol';

// チャート固有の拡張型をエクスポート
export type { ChartSymbolInfo } from './symbol';

// トレード関連の型をエクスポート
export type { 
  TradeDirection, TradeData, TradeListProps,
  MarketStatsData, MarketStatsProps,
  BitgetOrderBookResponse, BitgetTradesResponse,
  BitgetTickerResponse
} from './orderbook'; 