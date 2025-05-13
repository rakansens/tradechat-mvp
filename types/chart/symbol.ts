// types/chart/symbol.ts
// チャート用シンボル関連の型定義

import { ExchangeType } from '../api';

/**
 * 銘柄情報の型
 */
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

/**
 * シンボル一覧コンポーネントのProps
 */
export interface SymbolListProps {
  symbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectSymbol?: (symbol: string) => void;
}

/**
 * Bitget取引所の銘柄情報APIレスポンス型
 */
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