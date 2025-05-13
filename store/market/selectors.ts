// store/market/selectors.ts
// 更新: 基本セレクターとメモ化されたセレクターの明確な分離
// 更新: 型安全性の向上のため、明示的な型定義を使用
// 更新: 2025-06-01 - OrderBookStore統合のためのセレクター追加
//
// このファイルはZustandストアのパフォーマンスを向上させるためのセレクター関数を提供します。
// 基本セレクターは単純なステート取得のみを行い、計算が必要なセレクターはメモ化されています。

import { createSelector } from 'reselect';
import type { OrderBookData, OrderBookEntry, TradeData, MarketStatsData, SymbolInfo } from '@/types/market';
import type { ExchangeType } from '@/types/api';
import type { OrderBookPollingInfo } from './state';

// ==========================================
// 基本セレクター
// ==========================================
// 単純なステート取得のみを行う関数

// 型定義
interface MarketStateBase {
  currentSymbol: string;
  exchangeType: ExchangeType;
  orderBook: OrderBookData | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  trades: TradeData[];
  marketStats: MarketStatsData | null;
  symbols: SymbolInfo[];
  isDemoMode: boolean;
  ws: { subscribed: boolean };
  polling: OrderBookPollingInfo;
}

export const selectMarketCurrentSymbol = (state: { currentSymbol: string }) => state.currentSymbol;
export const selectExchangeType = (state: { exchangeType: ExchangeType }) => state.exchangeType;
export const selectOrderBook = (state: { orderBook: OrderBookData | null }) => state.orderBook;
export const selectIsLoadingOrderBook = (state: { isLoadingOrderBook: boolean }) => state.isLoadingOrderBook;
export const selectOrderBookError = (state: { orderBookError: string | null }) => state.orderBookError;
export const selectTrades = (state: { trades: TradeData[] }) => state.trades;
export const selectMarketStats = (state: { marketStats: MarketStatsData | null }) => state.marketStats;
export const selectSymbols = (state: { symbols: SymbolInfo[] }) => state.symbols;
export const selectIsDemoMode = (state: { isDemoMode: boolean }) => state.isDemoMode;

// OrderBookStore統合: WebSocketとポーリング関連セレクター
export const selectOrderBookWsSubscribed = (state: { ws: { subscribed: boolean } }) => state.ws.subscribed;
export const selectOrderBookPollingInfo = (state: { polling: OrderBookPollingInfo }) => state.polling;
export const selectOrderBookPollingActive = (state: { polling: OrderBookPollingInfo }) => state.polling.active;
export const selectOrderBookLastPollTime = (state: { polling: OrderBookPollingInfo }) => state.polling.lastPollTime;

// ==========================================
// メモ化されたセレクター
// ==========================================
// 計算処理を含み、結果をメモ化する関数

// オーダーブック関連のメモ化されたセレクター
export const selectBids = createSelector(
  [selectOrderBook],
  (orderBook: OrderBookData | null): OrderBookEntry[] => {
    if (!orderBook || !orderBook.bids) return [];
    
    // 文字列ペアの配列形式の場合は変換
    if (orderBook.bids.length > 0 && Array.isArray(orderBook.bids[0]) && typeof orderBook.bids[0][0] === 'string') {
      // [string, string][] 形式から OrderBookEntry[] へ変換
      return (orderBook.bids as [string, string][]).map(([price, amount]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount)
      }));
    }
    
    // 既にOrderBookEntry[]形式の場合
    return orderBook.bids as OrderBookEntry[];
  }
);

export const selectAsks = createSelector(
  [selectOrderBook],
  (orderBook: OrderBookData | null): OrderBookEntry[] => {
    if (!orderBook || !orderBook.asks) return [];
    
    // 文字列ペアの配列形式の場合は変換
    if (orderBook.asks.length > 0 && Array.isArray(orderBook.asks[0]) && typeof orderBook.asks[0][0] === 'string') {
      // [string, string][] 形式から OrderBookEntry[] へ変換
      return (orderBook.asks as [string, string][]).map(([price, amount]) => ({
        price: parseFloat(price),
        amount: parseFloat(amount)
      }));
    }
    
    // 既にOrderBookEntry[]形式の場合
    return orderBook.asks as OrderBookEntry[];
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

// スプレッド関連のメモ化されたセレクター
export const selectSpread = createSelector(
  [selectHighestBid, selectLowestAsk],
  (highestBid: number, lowestAsk: number): number => {
    if (highestBid === 0 || lowestAsk === 0) return 0;
    return lowestAsk - highestBid;
  }
);

export const selectSpreadPercent = createSelector(
  [selectHighestBid, selectLowestAsk],
  (highestBid: number, lowestAsk: number): number => {
    if (highestBid === 0 || lowestAsk === 0) return 0;
    return ((lowestAsk - highestBid) / lowestAsk) * 100;
  }
);

// 取引統計関連のメモ化されたセレクター
export const select24hVolume = createSelector(
  [selectMarketStats],
  (marketStats: MarketStatsData | null): number => {
    if (!marketStats) return 0;
    return marketStats.volume24h || 0;
  }
);

export const select24hPriceChangePercent = createSelector(
  [selectMarketStats],
  (marketStats: MarketStatsData | null): number => {
    if (!marketStats) return 0;
    return marketStats.priceChangePercent24h || 0;
  }
);

// ==========================================
// パラメータ化されたメモ化セレクター
// ==========================================
// パラメータを受け取り、メモ化された結果を返す関数

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
