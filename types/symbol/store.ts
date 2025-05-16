/**
 * シンボル関連のストア型定義
 * 
 * このファイルはシンボル関連のストア状態とアクションの型を定義します。
 */

import { ExchangeProductType } from '../constants/enums';
import { SymbolInfo, SymbolChangeHistoryEntry } from './common';

/**
 * シンボルストアの状態
 */
export interface SymbolState {
  currentSymbol: string;                  // 現在選択されているシンボル
  exchangeType: ExchangeProductType;       // 現在の取引タイプ
  symbolsList: SymbolInfo[];               // シンボル一覧
  filteredSymbols: SymbolInfo[];           // フィルタリングされたシンボル一覧
  isLoading: boolean;                      // 読み込み中フラグ
  error: string | null;                    // エラーメッセージ
  filterOptions: SymbolFilterOptions;      // フィルターオプション
  changeHistory: SymbolChangeHistoryEntry[]; // 変更履歴
}

/**
 * シンボルフィルターオプション
 * ストア用のフィルターオプション
 */
export interface SymbolFilterOptions {
  search?: string;                   // 検索クエリ
  quoteAsset?: string;               // クォートアセットでフィルタリング
  showFavoritesOnly?: boolean;       // お気に入りのみ表示
  hideStablePairs?: boolean;         // 安定コインペアを非表示
  
  // レガシーサポートのためのプロパティ
  searchTerm?: string;              // searchのエイリアス
  quoteCoin?: string;               // quoteAssetのエイリアス
  favoritesOnly?: boolean;          // showFavoritesOnlyのエイリアス
  stable?: boolean;                 // hideStablePairsの反対の意味
}

/**
 * シンボルストアのアクション
 */
export interface SymbolActions {
  // シンボル関連
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeProductType) => void;
  setSymbols: (symbols: SymbolInfo[]) => void;
  addSymbol: (symbol: SymbolInfo) => void;
  updateSymbol: (symbol: Partial<SymbolInfo> & { id: string }) => void;
  removeSymbol: (symbolId: string) => void;
  
  // フィルター関連
  setFilterOptions: (options: Partial<SymbolFilterOptions>) => void;
  applyFilters: (options: SymbolFilterOptions) => void;
  resetFilters: () => void;
  
  // お気に入り関連
  toggleFavorite: (symbolId: string) => void;
  
  // フィルタークリア
  clearFilters: () => void;
  
  // 非同期アクション
  fetchSymbols: (exchangeType?: ExchangeProductType) => Promise<void>;
  saveSymbol: (symbol: SymbolInfo) => Promise<void>;
  deleteSymbol: (symbolId: string) => Promise<void>;
  
  // 履歴関連
  addToHistory: (entry: Omit<SymbolChangeHistoryEntry, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  getSymbolChangeHistory: () => SymbolChangeHistoryEntry[];
}

/**
 * シンボルストアのスライス型
 */
export type SymbolSlice = SymbolState & SymbolActions;
