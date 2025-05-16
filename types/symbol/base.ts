/**
 * シンボル関連の型定義
 * 
 * このファイルは銘柄情報と関連機能の型定義を集約しています。
 * T-4フェーズでtypes/symbol.tsから移動されました。
 * T-6フェーズで重複型定義を解消し、共通モジュールからインポートするように変更しました。
 */

import { ExchangeType } from '../network/api';
import type { SymbolInfo, SymbolFilterOptions } from '../common/symbol';

// 共通型を再エクスポート
export type { SymbolInfo, SymbolFilterOptions };

/**
 * @deprecated common/symbol.tsのSymbolFilterOptionsを使用してください。
 * このインターフェースは後方互換性のために保持されています。
 */
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

/**
 * UI層用のシンボル情報型（レガシー互換性のため）
 * @deprecated common/symbol.tsのSymbolInfoを使用し、必要に応じて変換してください。
 */
export interface LegacySymbolInfo {
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
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  changeHistory: SymbolChangeHistoryEntry[];
}

/**
 * 共通SymbolInfo型とレガシーSymbolInfo型の変換関数
 */
export function toUISymbol(commonSymbol: SymbolInfo): LegacySymbolInfo {
  return {
    symbol: commonSymbol.symbol,
    baseAsset: commonSymbol.baseCoin,
    quoteAsset: commonSymbol.quoteCoin,
    displayName: `${commonSymbol.baseCoin}/${commonSymbol.quoteCoin}`,
    pricePrecision: commonSymbol.pricePrecision,
    quantityPrecision: commonSymbol.quantityPrecision,
    minNotional: commonSymbol.minOrderSize?.toString(),
    status: commonSymbol.status,
    isFavorite: commonSymbol.favorite
  };
}

/**
 * レガシーSymbolInfo型から共通SymbolInfo型への変換関数
 */
export function toCommonSymbol(uiSymbol: LegacySymbolInfo, exchangeType: ExchangeType): SymbolInfo {
  return {
    symbol: uiSymbol.symbol,
    baseCoin: uiSymbol.baseAsset,
    quoteCoin: uiSymbol.quoteAsset,
    minOrderSize: parseFloat(uiSymbol.minNotional || '0'),
    pricePrecision: uiSymbol.pricePrecision,
    quantityPrecision: uiSymbol.quantityPrecision,
    status: uiSymbol.status,
    exchangeType,
    favorite: uiSymbol.isFavorite
  };
} 