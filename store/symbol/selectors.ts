// store/symbol/selectors.ts
// 作成: SymbolSliceのセレクター
// 更新: 型エラーを修正
// 更新: セレクター名の衝突を解決
// 更新: プロパティ名変更に合わせた修正

import { createSelector } from 'reselect';
import type { RootStore } from '../rootStore';
import { type SymbolInfo, type FilterOptions, type SymbolChangeHistory } from '@/services/symbol/symbol-service';
import { ExchangeType } from '@/types/api';

/**
 * 現在のシンボルを選択するセレクター
 * 注：他のセレクターとの名前衝突を避けるためにsymbol接頭辞を追加
 */
export const selectSymbolCurrentSymbol = (state: RootStore): string => state.currentSymbol;

/**
 * 取引種別を選択するセレクター
 * 注：他のセレクターとの名前衝突を避けるためにsymbol接頭辞を追加
 */
export const selectSymbolExchangeType = (state: RootStore) => state.exchangeType;

/**
 * すべてのシンボル情報を選択するセレクター
 * 注：型互換性のためにアサーションを使用
 */
export const selectSymbolList = (state: RootStore) => {
  return 'symbolsList' in state 
    ? (state as any).symbolsList as SymbolInfo[]
    : [] as SymbolInfo[];
};

/**
 * フィルタリングされたシンボル情報を選択するセレクター
 * 注：RootStoreに統合されるまでの一時的な対応
 */
export const selectFilteredSymbols = (state: RootStore) => {
  return 'filteredSymbols' in state 
    ? (state as any).filteredSymbols as SymbolInfo[]
    : [] as SymbolInfo[];
};

/**
 * フィルターオプションを選択するセレクター
 * 注：RootStoreに統合されるまでの一時的な対応
 */
export const selectSymbolFilterOptions = (state: RootStore) => {
  return 'symbolFilterOptions' in state
    ? (state as any).symbolFilterOptions as FilterOptions
    : { searchTerm: '', quoteAsset: '', favoritesOnly: false } as FilterOptions;
};

/**
 * シンボルローディング状態を選択するセレクター
 */
export const selectIsLoadingSymbols = (state: RootStore): boolean => {
  return 'isLoadingSymbols' in state ? (state as any).isLoadingSymbols : false;
};

/**
 * シンボルエラー状態を選択するセレクター
 */
export const selectSymbolError = (state: RootStore): string | null => {
  return 'symbolError' in state ? (state as any).symbolError : null;
};

/**
 * シンボル変更履歴を選択するセレクター
 */
export const selectSymbolChangeHistory = (state: RootStore): SymbolChangeHistory[] => {
  return 'symbolChangeHistory' in state ? (state as any).symbolChangeHistory : [];
};

/**
 * 特定のシンボルの詳細情報を選択するメモ化されたセレクター
 */
export const makeSelectSymbolInfo = () => 
  createSelector(
    [selectSymbolList, (_: RootStore, symbolId: string) => symbolId],
    (symbols: SymbolInfo[], symbolId: string): SymbolInfo | undefined => {
      return symbols.find(s => s.symbol === symbolId);
    }
  );

/**
 * お気に入りシンボルのみを選択するメモ化されたセレクター
 */
export const selectFavoriteSymbols = createSelector(
  [selectSymbolList],
  (symbols: SymbolInfo[]): SymbolInfo[] => {
    return symbols.filter(s => s.isFavorite);
  }
);

/**
 * 指定された基軸通貨のシンボルを選択するメモ化されたセレクター
 */
export const makeSelectSymbolsByQuoteAsset = () => 
  createSelector(
    [selectSymbolList, (_: RootStore, quoteAsset: string) => quoteAsset],
    (symbols: SymbolInfo[], quoteAsset: string): SymbolInfo[] => {
      return symbols.filter(s => s.quoteAsset === quoteAsset);
    }
  );

/**
 * 基軸通貨の一覧を選択するメモ化されたセレクター
 */
export const selectQuoteAssets = createSelector(
  [selectSymbolList],
  (symbols: SymbolInfo[]): string[] => {
    // 重複を排除して基軸通貨の一覧を取得
    const quoteAssets = new Set(symbols.map(s => s.quoteAsset));
    return Array.from(quoteAssets).sort();
  }
); 