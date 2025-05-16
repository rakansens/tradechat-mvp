// store/symbol/selectors.ts
// 作成: SymbolSliceのセレクター
// 更新: 型エラーを修正
// 更新: セレクター名の衝突を解決
// 更新: プロパティ名変更に合わせた修正
// 更新: シンボルスライスのセレクタ関数を定義する
// 更新: T-7.6フェーズ - 型インポートパスの修正

import { createSelector } from 'reselect';
import type { RootStore } from '../rootStore';
import { logger } from '@/utils/common';
import { type SymbolInfo, type FilterOptions, type SymbolChangeHistory } from '@/services/symbol';
import { ExchangeType } from '@/types/network/api';

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
  (symbols) => symbols.filter(symbol => symbol.favorite)
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

// シンボルが特定の条件でフィルタリングされていないかのセレクタ
export const selectRawSymbols = (state: RootStore) => {
  return state.symbols.filter(s => !s.favorite); // お気に入りではないシンボルを取得
};

// 特定の基軸通貨に基づいてフィルタリングされたシンボルのセレクタ
export const selectSymbolsByQuoteAsset = createSelector(
  [(state: RootStore) => state.symbols, (state: RootStore) => state.filterOptions.quoteAsset],
  (symbols, quoteAsset) => {
    if (!quoteAsset) return symbols;
    return symbols.filter(symbol => symbol.quoteCoin === quoteAsset);
  }
);

// 利用可能な基軸通貨のリストのセレクタ
export const selectQuoteAssets = createSelector(
  [(state: RootStore) => state.symbols],
  (symbols) => {
    const uniqueQuoteAssets = new Set(symbols.map(s => s.quoteCoin));
    return Array.from(uniqueQuoteAssets).sort();
  }
); 