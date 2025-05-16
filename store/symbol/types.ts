// store/symbol/types.ts
// 作成: 2025-10-05 - SymbolSliceのState, Actions, Slice型を定義

import { ExchangeType } from '@/types/network/api';
import { type FilterOptions, type SymbolInfo, type SymbolChangeHistory } from '@/services/symbol';
import { type SliceCreator } from '@/types/store/core';

/**
 * シンボルスライスの状態型定義
 * 注: 他のスライスとの名前衝突を避けるため、一部のプロパティに接頭辞を追加
 */
export interface SymbolSliceState {
  // シンボル関連の状態
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbolsList: SymbolInfo[]; // 名前衝突回避のため変更
  filteredSymbols: SymbolInfo[];
  symbolFilterOptions: FilterOptions; // 名前衝突回避のため変更
  isLoadingSymbols: boolean;
  symbolError: string | null;
  symbolChangeHistory: SymbolChangeHistory[];
}

/**
 * シンボルスライスのアクション型定義
 */
export interface SymbolSliceActions {
  // シンボル関連のアクション
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  applyFilters: (options: FilterOptions) => void;
  
  // デバッグ関連のアクション
  getSymbolChangeHistory: () => SymbolSliceState['symbolChangeHistory'];
}

/**
 * シンボルスライスの型定義（状態+アクション）
 */
export type SymbolSlice = SymbolSliceState & SymbolSliceActions;

/**
 * スライスクリエーター型定義
 */
export type SymbolSliceCreator = SliceCreator<SymbolSlice, SymbolSliceState>; 