// types/chart/orderbook.ts
// オーダーブック関連の型定義

import { ExchangeType } from '../api';

/**
 * オーダーブックエントリーの型
 */
export interface OrderBookEntry {
  price: number;
  amount: number;
  total?: number; // UI表示用の累積数量
}

/**
 * オーダーブックデータの型
 */
export interface OrderBookData {
  symbol?: string;
  timestamp: number;
  bids: OrderBookEntry[] | [string, string][]; // 買い注文
  asks: OrderBookEntry[] | [string, string][]; // 売り注文
}

export interface OrderBookProps {
  data: OrderBookData | null;
  isLoading: boolean;
  error: string | null;
  depth?: number; // 表示する深さ（デフォルト値はコンポーネントで設定）
}

// 市場・取引関連の型定義

/**
 * 取引方向を示す列挙型
 */
export enum TradeDirection {
  BUY = 'buy',
  SELL = 'sell'
}

/**
 * 取引データの型
 */
export interface TradeData {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  timestamp: number;
  direction: TradeDirection;
}

/**
 * 取引リストコンポーネントのProps
 */
export interface TradeListProps {
  trades: TradeData[];
  isLoading: boolean;
  error: string | null;
  limit?: number; // 表示する取引数
}

/**
 * 市場統計データの型
 */
export interface MarketStatsData {
  symbol: string;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChangePercent24h: number;
  lastPrice: number;
  timestamp: number;
}

/**
 * 市場統計コンポーネントのProps
 */
export interface MarketStatsProps {
  data: MarketStatsData | null;
  isLoading: boolean;
  error: string | null;
}

// API レスポンス型

/**
 * Bitget取引所のオーダーブックAPIレスポンス型
 */
export interface BitgetOrderBookResponse {
  code: string;
  data: {
    asks: string[][];
    bids: string[][];
    timestamp: string;
  };
  msg: string;
}

/**
 * Bitget取引所の取引履歴APIレスポンス型
 */
export interface BitgetTradesResponse {
  code: string;
  data: {
    items: {
      price: string;
      side: string;
      size: string;
      timestamp: string;
      tradeId: string;
    }[];
  };
  msg: string;
}

/**
 * Bitget取引所のティッカーAPIレスポンス型
 */
export interface BitgetTickerResponse {
  code: string;
  data: {
    high24h: string;
    low24h: string;
    volume24h: string;
    priceChangePercent24h: string;
    lastPr: string;
    ts: string;
  }[];
  msg: string;
} 