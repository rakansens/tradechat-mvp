// store/market/selectors.ts
// 作成: マーケットストア用のメモ化されたセレクター関数
// 
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { OrderBookData, OrderBookEntry, TradeData, MarketStatsData, SymbolInfo } from '@/types/market';
import type { ExchangeType } from '@/types/api';

// 基本セレクター
export const selectMarketCurrentSymbol = (state: { currentSymbol: string }) => state.currentSymbol;
export const selectExchangeType = (state: { exchangeType: ExchangeType }) => state.exchangeType;
export const selectOrderBook = (state: { orderBook: OrderBookData | null }) => state.orderBook;
export const selectIsLoadingOrderBook = (state: { isLoadingOrderBook: boolean }) => state.isLoadingOrderBook;
export const selectOrderBookError = (state: { orderBookError: string | null }) => state.orderBookError;
export const selectTrades = (state: { trades: TradeData[] }) => state.trades;
export const selectMarketStats = (state: { marketStats: MarketStatsData | null }) => state.marketStats;
export const selectSymbols = (state: { symbols: SymbolInfo[] }) => state.symbols;
export const selectIsDemoMode = (state: { isDemoMode: boolean }) => state.isDemoMode;

// メモ化されたセレクター
export const selectBids = createSelector(
  [selectOrderBook],
  (orderBook: OrderBookData | null): OrderBookEntry[] => {
    if (!orderBook || !orderBook.bids) return [];
    return orderBook.bids;
  }
);

export const selectAsks = createSelector(
  [selectOrderBook],
  (orderBook: OrderBookData | null): OrderBookEntry[] => {
    if (!orderBook || !orderBook.asks) return [];
    return orderBook.asks;
  }
);

// 最高買い注文価格セレクター
export const selectHighestBid = createSelector(
  [selectBids],
  (bids: OrderBookEntry[]): number => {
    if (!bids || bids.length === 0) return 0;
    // 買い注文は通常価格の降順でソートされているため、最初の要素が最高価格
    return bids[0].price;
  }
);

// 最安売り注文価格セレクター
export const selectLowestAsk = createSelector(
  [selectAsks],
  (asks: OrderBookEntry[]): number => {
    if (!asks || asks.length === 0) return 0;
    // 売り注文は通常価格の昇順でソートされているため、最初の要素が最安価格
    return asks[0].price;
  }
);

// スプレッドセレクター
export const selectSpread = createSelector(
  [selectHighestBid, selectLowestAsk],
  (highestBid: number, lowestAsk: number): number => {
    if (highestBid === 0 || lowestAsk === 0) return 0;
    return lowestAsk - highestBid;
  }
);

// スプレッドパーセントセレクター
export const selectSpreadPercent = createSelector(
  [selectHighestBid, selectLowestAsk],
  (highestBid: number, lowestAsk: number): number => {
    if (highestBid === 0 || lowestAsk === 0) return 0;
    return ((lowestAsk - highestBid) / lowestAsk) * 100;
  }
);

// 累積数量セレクター（指定価格までの累積数量を計算）
export const selectCumulativeVolume = (side: 'bids' | 'asks', price: number) =>
  createSelector(
    [side === 'bids' ? selectBids : selectAsks],
    (orders: OrderBookEntry[]): number => {
      if (!orders || orders.length === 0) return 0;
      
      let cumulativeVolume = 0;
      
      if (side === 'bids') {
        // 買い注文の場合、指定価格以上の注文の累積数量
        for (const order of orders) {
          if (order.price >= price) {
            cumulativeVolume += order.amount;
          } else {
            break;
          }
        }
      } else {
        // 売り注文の場合、指定価格以下の注文の累積数量
        for (const order of orders) {
          if (order.price <= price) {
            cumulativeVolume += order.amount;
          } else {
            break;
          }
        }
      }
      
      return cumulativeVolume;
    }
  );

// 最近の取引セレクター（最新のn件）
export const selectRecentTrades = (count: number = 10) =>
  createSelector(
    [selectTrades],
    (trades: TradeData[]): TradeData[] => {
      if (!trades || trades.length === 0) return [];
      return trades.slice(0, count);
    }
  );

// 平均取引価格セレクター（最新のn件）
export const selectAverageTradePrice = (count: number = 10) =>
  createSelector(
    [selectTrades],
    (trades: TradeData[]): number => {
      if (!trades || trades.length === 0) return 0;
      
      const recentTrades = trades.slice(0, count);
      const sum = recentTrades.reduce((acc, trade) => acc + trade.price, 0);
      
      return sum / recentTrades.length;
    }
  );

// 24時間取引量セレクター
export const select24hVolume = createSelector(
  [selectMarketStats],
  (marketStats: MarketStatsData | null): number => {
    if (!marketStats) return 0;
    return marketStats.volume24h || 0;
  }
);

// 24時間価格変化率セレクター
export const select24hPriceChangePercent = createSelector(
  [selectMarketStats],
  (marketStats: MarketStatsData | null): number => {
    if (!marketStats) return 0;
    return marketStats.priceChangePercent24h || 0;
  }
);
