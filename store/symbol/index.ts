// store/symbol/index.ts
// 作成: SymbolSliceの統合とエクスポート
// 更新: Zustandのset関数の型定義を修正
// 更新: T-7.7.5フェーズ - get関数の戻り値型をSymbolSliceに修正して型安全性を向上
// 更新: T-7.8フェーズ - StoreApi型を使用してSliceの型安全性を向上
// 更新: 2025-10-05 - 型定義をtypes.tsに移動し、SliceCreator型に準拠するように修正
// 更新: 2025-10-09 - S-10.1フェーズ: 暗黙的any型を明示的型に修正

import { initialSymbolState } from './state';
import { createSymbolActions } from './actions';
import { create } from 'zustand';
import { type Draft } from 'immer';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  type SymbolState, 
  type SymbolActions,
  type SymbolFilterOptions 
} from '@/types/symbol/store';

// レガシーサポートのための型エイリアス
type SymbolSlice = SymbolState & SymbolActions;
type SymbolSliceCreator = (set: any, get: any) => SymbolSlice;
import { createImmerSetter } from '@/store/core/immerSet';
import { type MutateDraft } from '@/types/store/core';

import type { SymbolInfo, SymbolChangeHistoryEntry } from '@/types/symbol/common';
import type { ExchangeProductType } from '@/types/constants/enums';

/**
 * SymbolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createSymbolSlice = (
  set: (fn: (draft: Draft<SymbolState>) => void) => void,
  get: () => SymbolSlice
): SymbolSlice => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<SymbolState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as SymbolSlice;
  
  // アクションを作成
  const actions = createSymbolActions(
    immerSet,
    getState
  );
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態を完全なSymbolStateとして展開
    // SymbolState のプロパティ
    currentSymbol: initialSymbolState.currentSymbol || '',
    exchangeType: initialSymbolState.exchangeType!,
    symbolsList: initialSymbolState.symbolsList || [],
    filteredSymbols: initialSymbolState.filteredSymbols || [],
    filterOptions: initialSymbolState.filterOptions || {
      search: '',
      quoteAsset: '',
      showFavoritesOnly: false,
      hideStablePairs: false
    },
    isLoading: initialSymbolState.isLoading || false,
    error: initialSymbolState.error || null,
    changeHistory: initialSymbolState.changeHistory || [],
    
    // SymbolActions のメソッド
    setCurrentSymbol: actions.setCurrentSymbol,
    // 新しいProductTypeメソッドを公開
    setProductType: actions.setProductType,
    // 後方互換性のため旧メソッドも保持
    setExchangeType: actions.setExchangeType,
    setSymbols: actions.setSymbols,
    addSymbol: actions.addSymbol,
    updateSymbol: actions.updateSymbol,
    removeSymbol: actions.removeSymbol,
    setFilterOptions: actions.setFilterOptions,
    applyFilters: actions.applyFilters,
    resetFilters: actions.resetFilters,
    fetchSymbols: actions.fetchSymbols,
    saveSymbol: actions.saveSymbol,
    deleteSymbol: actions.deleteSymbol,
    addToHistory: actions.addToHistory,
    clearHistory: actions.clearHistory,
    
    // お気に入りのトグル
    toggleFavorite: actions.toggleFavorite,
    
    // フィルターをクリア
    clearFilters: actions.clearFilters,
    
    // シンボル変更履歴を取得
    getSymbolChangeHistory: actions.getSymbolChangeHistory
  };
};

/**
 * SymbolSliceを使用したスタンドアロンストア
 * このストアは移行期間中に使用され、最終的にはrootStoreに統合されます
 * @deprecated 代わりにrootStoreのSymbolSliceを使用してください
 */
export const useSymbolStore = create<SymbolSlice>()(
  devtools(
    immer((set, get) => createSymbolSlice(set, get)),
    { name: "symbol-store" }
  )
);

// 型をエクスポート
export type { SymbolSlice, SymbolState, SymbolActions } from '@/types/store/symbol';