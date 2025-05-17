// types/store/symbol.ts
// 作成: 2025-10-07 - シンボルストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/symbol/types.tsから型定義を統合
// 更新: 2025-10-08 - S-9.2フェーズ: ExchangeType型を統一しSymbolChangeHistory型を修正
// 更新: 2025-10-09 - S-10.3フェーズ: symbolChangeHistory型のany型を明示的な型に変更

import { ExchangeType, ExchangeProductType, ProductType } from '@/types/constants/enums';
import { type SliceCreator } from '@/types/store/core';
import type { 
  SymbolInfo
} from '@/types/symbol/common'; 
import type { 
  SymbolDetail, 
  SymbolFilterOptions,
  SymbolChangeValue,
  SymbolChangeHistoryEntry
} from '@/types/symbol/common';

/**
 * シンボルフィルターオプション
 */
export interface StoreFilterOptions {
  search?: string;                   // 検索クエリ
  quoteAsset?: string;               // クォートアセットでフィルタリング
  showFavoritesOnly?: boolean;       // お気に入りのみ表示
  hideStablePairs?: boolean;         // 安定コインペアを非表示
}

// 再エクスポート
export type { 
  SymbolInfo, 
  SymbolDetail, 
  SymbolFilterOptions,
  SymbolChangeValue,
  SymbolChangeHistoryEntry
};

// SymbolChangeHistory型をSymbolChangeHistoryEntry[]として再定義
export type SymbolChangeHistory = SymbolChangeHistoryEntry[];

/**
 * シンボルスライスの状態型定義
 * 注: 他のスライスとの名前衝突を避けるため、一部のプロパティに接頭辞を追加
 */
export interface SymbolState {
  // シンボル関連の状態
  currentSymbol: string;
  exchangeType: ExchangeProductType; // 取引タイプ（'spot' または 'futures'）
  symbolsList: SymbolInfo[]; // 名前衝突回避のため変更
  filteredSymbols: SymbolInfo[];
  symbolFilterOptions: StoreFilterOptions; // 名前衝突回避のため変更
  isLoadingSymbols: boolean;
  symbolError: string | null;
  symbolChangeHistory: SymbolChangeHistoryEntry[];
}

/**
 * シンボルスライスのアクション型定義
 */
export interface SymbolActions {
  // シンボル関連のアクション
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  
  /**
   * 取引種別を設定
   * @param type ExchangeTypeもしくはProductType
   */
  setProductType: (type: ExchangeType | ProductType) => ProductType;
  
  /**
   * @deprecated setProductTypeを使用してください
   */
  setExchangeType: (type: ExchangeType | ProductType) => ProductType;
  fetchSymbols: (exchangeType?: ProductType) => Promise<void>;
  setFilterOptions: (options: Partial<StoreFilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  applyFilters: (options: StoreFilterOptions) => void;
  getSymbolChangeHistory: () => SymbolState['symbolChangeHistory'];
}

// 完全なシンボルスライスの型定義
export type SymbolSlice = SymbolState & SymbolActions;

// スライスクリエーター型定義
export type SymbolSliceCreator = SliceCreator<SymbolSlice, SymbolState>; 