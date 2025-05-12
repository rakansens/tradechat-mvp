// types/market.ts
// 市場データ関連の型定義

import { ExchangeType } from './api';

// オーダーブック関連の型
export interface OrderBookEntry {
  price: number;
  amount: number;
  total?: number; // UI表示用の累積数量
}

/**
 * オーダーブックデータの型
 * chart.tsの定義と互換性を持たせるために、配列形式もサポート
 */
export interface OrderBookData {
  symbol: string;
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

// 取引履歴関連の型
export enum TradeDirection {
  BUY = 'buy',
  SELL = 'sell'
}

export interface TradeData {
  id: string;
  symbol: string;
  price: number;
  amount: number;
  timestamp: number;
  direction: TradeDirection;
}

export interface TradeListProps {
  trades: TradeData[];
  isLoading: boolean;
  error: string | null;
  limit?: number; // 表示する取引数
}

// 市場統計関連の型
export interface MarketStatsData {
  symbol: string;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChangePercent24h: number;
  lastPrice: number;
  timestamp: number;
}

export interface MarketStatsProps {
  data: MarketStatsData | null;
  isLoading: boolean;
  error: string | null;
}

// 銘柄情報関連の型
export interface SymbolInfo {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  minOrderSize: number;
  pricePrecision: number;
  quantityPrecision: number;
  status: string; // 'online' | 'offline' などの状態
  exchangeType: ExchangeType;
}

export interface SymbolListProps {
  symbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectSymbol?: (symbol: string) => void;
}

// API レスポンス型
export interface BitgetOrderBookResponse {
  code: string;
  data: {
    asks: string[][];
    bids: string[][];
    timestamp: string;
  };
  msg: string;
}

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

export interface BitgetSymbolsResponse {
  code: string;
  data: {
    symbol: string;
    baseCoin: string;
    quoteCoin: string;
    minTradeAmount: string;
    pricePrecision: string;
    quantityPrecision: string;
    status: string;
  }[];
  msg: string;
} 