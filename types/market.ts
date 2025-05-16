// types/market.ts
// 市場データ関連の型定義
// 更新: 共通モジュールからOrderBookEntryとSymbolInfoをインポートするように変更

import { ExchangeType } from './network/api';
import { 
  OrderBookEntry, OrderBookData, OrderBookProps, 
  BitgetOrderBookResponse 
} from './common/orderbook';
import { 
  SymbolInfo, SymbolListProps, 
  BitgetSymbolsResponse 
} from './common/symbol';

// オーダーブック関連の型を再エクスポート
export type { OrderBookEntry, OrderBookData, OrderBookProps, BitgetOrderBookResponse };

// シンボル関連の型を再エクスポート
export type { SymbolInfo, SymbolListProps, BitgetSymbolsResponse };

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

// API レスポンス型（Bitget取引所固有のものは共通モジュールにすでに移動）
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