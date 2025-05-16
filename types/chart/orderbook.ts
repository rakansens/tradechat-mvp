/**
 * @deprecated – 2025-T8 で削除予定。
 * OrderBook 型はすべて `@/types/common/orderbook` からインポートしてください。
 */

export type {
  OrderBookData,
  OrderBookEntry,
  OrderBookProps,
  BitgetOrderBookResponse,
} from '@/types/common/orderbook';

export type {
  TradeDirection,
  TradeData,
  MarketStatsData,
  MarketStatsProps,
  BitgetTradesResponse,
  BitgetTickerResponse,
} from '../market';