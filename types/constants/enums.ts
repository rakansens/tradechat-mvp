/**
 * types/constants/enums.ts
 * 作成: T-7.3フェーズ - 共通のEnum型と定数値を集約
 * 更新: T-7.5フェーズ - 8時間足を追加
 * 更新: リファクタリング対応 - 後方互換エイリアスの追加
 * 更新: 2025-05-17 - ExchangeTypeとProductTypeの分離と正規化
 * 
 * このファイルはアプリケーション全体で使用される列挙型と定数値を
 * Single Source of Truthとして一元管理します。
 * 
 * 目的:
 * 1. 重複排除
 * 2. 型とスキーマ（Zod）間の依存方向を整理
 * 3. 一貫性の確保
 */

// これらの型はtypes/exchange.tsからインポートして使用するようになりました
import { ExchangeType as NewExchangeType, ProductType as NewProductType } from '../exchange';

// トレード方向の定数
export const TRADE_SIDES = ['buy', 'sell'] as const;
export type TradeSide = typeof TRADE_SIDES[number];

// 取引所タイプの定数（bitget / binance）
export const EXCHANGE_TYPES = ['bitget', 'binance', 'bybit', 'demo'] as const;
export type ExchangeType = typeof EXCHANGE_TYPES[number];

// 取引商品タイプの定数（現物/先物）
export const PRODUCT_TYPES = ['spot', 'futures'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

// ------------------------------------------------------------------
// LEGACY TYPES - 後方互換性のための型定義
// ------------------------------------------------------------------

/**
 * @deprecated ExchangeTypeを使用してください
 */
export type OriginalExchangeType = ExchangeType;

/**
 * @deprecated PRODUCT_TYPESを使用してください
 */
export const EXCHANGE_PRODUCT_TYPES = PRODUCT_TYPES;

/**
 * @deprecated ProductTypeを使用してください
 */
export type ExchangeProductType = ProductType;

// チャートの時間枠
export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] as const;
export type Timeframe = typeof TIMEFRAMES[number];

// チャートの種類
export const CHART_TYPES = ['candles', 'line', 'bars', 'area'] as const;
export type ChartType = typeof CHART_TYPES[number];

// 後方互換性のためのエイリアス（移行期間のみ使用）
// ChartTypeのエイリアスと代替型定義

// candlestickをcandlesにマッピングするエイリアス
export type LegacyChartType = 'candlestick';
// barをbarsにマッピングするエイリアス
export type LegacyBarType = 'bar';
// 拡張されたChartType型（全ての互換性を含む）
export type ExtendedChartType = 'candlestick' | 'candles' | 'line' | 'bar' | 'bars' | 'area';

// インジケーターの種類の定義
// UI層で必要な型定義を再エクスポート
export type IndicatorType = string;

/**
 * アクティブなインジケーターの設定
 */
export interface ActiveIndicator {
  type: IndicatorType;
  params: Record<string, any>;
}

// タブの種類
export const TAB_TYPES = ['chart', 'market', 'trades', 'orders', 'analysis', 'chat'] as const;
export type TabType = typeof TAB_TYPES[number];

// オーダータイプ
export const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit', 'take_profit', 'take_profit_limit'] as const;
export type OrderType = typeof ORDER_TYPES[number]; 

// 後方互換性のためのエイリアス（移行期間のみ使用）
// ExchangeType と ExchangeProductType の混同を解決
export type LegacyExchangeType = ExchangeProductType;