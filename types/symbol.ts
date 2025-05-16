/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/symbol/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/symbol からインポートすることを推奨します。
 */

// types/symbol.ts
// 作成: 銘柄情報の型定義

/**
 * 銘柄情報の型定義
 * 更新: 取引量データのプロパティを追加
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
 * types/symbol.ts
 * シンボル関連の型定義
 * 
 * 作成: 2025-06-05 - 古いuseSymbolStoreからの型定義を移行
 */

import { ExchangeType } from './network/api';
import type { SymbolInfo, SymbolFilterOptions } from './common/symbol';

// 注: 共通モジュールから直接インポートしてください
// import { SymbolInfo, SymbolFilterOptions } from './common/symbol';

/**
 * シンボル（銘柄）変更履歴のエントリー
 */
export interface SymbolChangeHistoryEntry {
  timestamp: number;
  symbol: string;
  exchangeType: ExchangeType;
}

/**
 * シンボルストアの状態
 */
export interface SymbolSliceState {
  // シンボル関連の状態
  currentSymbol: string;
  previousSymbols: SymbolChangeHistoryEntry[];
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  selectedSymbol: SymbolInfo | null;
  
  // フィルター関連の状態
  filterOptions: SymbolFilterOptions;
  
  // ローディング状態
  isLoading: boolean;
  error: string | null;
  
  // ドメイン固有のメソッド
  setCurrentSymbol: (symbol: string) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<SymbolFilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  getSymbolByName: (symbolName: string) => SymbolInfo | undefined;
  
  // 内部メソッド
  _normalizeSymbol: (symbol: string) => string;
}