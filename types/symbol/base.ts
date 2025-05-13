/**
 * シンボル関連の型定義
 * 
 * このファイルは銘柄情報と関連機能の型定義を集約しています。
 * T-4フェーズでtypes/symbol.tsから移動されました。
 */

import { ExchangeType } from '../network/api';

/**
 * 銘柄情報の型定義
 */
export interface SymbolInfo {
  /** 銘柄のシンボル (例: BTCUSDT) */
  symbol: string;
  /** 基礎通貨 (例: BTC) */
  baseAsset: string;
  /** 見積通貨 (例: USDT) */
  quoteAsset: string;
  /** 表示名 (例: BTC/USDT) */
  displayName: string;
  /** 価格の精度 (小数点以下の桁数) */
  pricePrecision: number;
  /** 数量の精度 (小数点以下の桁数) */
  quantityPrecision: number;
  /** 最小取引額 */
  minNotional?: string;
  /** 取引ステータス (例: TRADING, BREAK) */
  status: string;
  /** お気に入りフラグ */
  isFavorite?: boolean;
  /** 24時間取引量 */
  volume24h?: string;
  /** 24時間価格変動率 */
  priceChangePercent24h?: string;
  /** 最新価格 */
  lastPrice?: string;
}

/**
 * 銘柄リストのフィルタリングオプション
 */
export interface SymbolFilterOptions {
  /** 検索キーワード */
  searchTerm: string;
  /** 見積通貨フィルター (例: USDT, BTC) */
  quoteAsset: string;
  /** お気に入りのみ表示 */
  favoritesOnly: boolean;
}

/**
 * フィルターオプションの型定義
 */
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

/**
 * シンボル変更履歴エントリの型定義
 */
export interface SymbolChangeHistoryEntry {
  symbol: string;
  exchangeType: ExchangeType;
  timestamp: number;
  source: string;
}

/**
 * シンボルスライスの状態型定義
 */
export interface SymbolSliceState {
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbols: any[]; // SymbolInfo[]
  filteredSymbols: any[]; // SymbolInfo[]
  isLoading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  changeHistory: SymbolChangeHistoryEntry[];
} 