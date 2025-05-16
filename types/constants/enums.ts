/**
 * types/constants/enums.ts
 * 作成: T-7.3フェーズ - 共通のEnum型と定数値を集約
 * 更新: T-7.5フェーズ - 8時間足を追加
 * 
 * このファイルはアプリケーション全体で使用される列挙型と定数値を
 * Single Source of Truthとして一元管理します。
 * 
 * 目的:
 * 1. 重複排除
 * 2. 型とスキーマ（Zod）間の依存方向を整理
 * 3. 一貫性の確保
 */

// トレード方向の定数
export const TRADE_SIDES = ['buy', 'sell'] as const;
export type TradeSide = typeof TRADE_SIDES[number];

// 取引所の種類
export const EXCHANGE_TYPES = ['bitget', 'binance', 'bybit', 'demo'] as const;
export type ExchangeType = typeof EXCHANGE_TYPES[number];

// 取引タイプの定数（現物/先物）
export const EXCHANGE_PRODUCT_TYPES = ['spot', 'futures'] as const;
export type ExchangeProductType = typeof EXCHANGE_PRODUCT_TYPES[number];

// チャートの時間枠
export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'] as const;
export type Timeframe = typeof TIMEFRAMES[number];

// チャートの種類
export const CHART_TYPES = ['candlestick', 'line', 'bars', 'area'] as const;
export type ChartType = typeof CHART_TYPES[number];

// タブの種類
export const TAB_TYPES = ['chart', 'market', 'trades', 'orders', 'analysis', 'chat'] as const;
export type TabType = typeof TAB_TYPES[number];

// オーダータイプ
export const ORDER_TYPES = ['market', 'limit', 'stop', 'stop_limit', 'take_profit', 'take_profit_limit'] as const;
export type OrderType = typeof ORDER_TYPES[number]; 