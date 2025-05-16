// store/symbol/selectors.ts
// 作成: SymbolSliceのセレクター
// 更新: 型エラーを修正
// 更新: セレクター名の衝突を解決
// 更新: プロパティ名変更に合わせた修正
// 更新: シンボルスライスのセレクタ関数を定義する
// 更新: T-7.6フェーズ - 型インポートパスの修正
// 更新: T-7.7フェーズ - プロパティ名を統一（quoteCoin→quoteCoin、favorite→favorite）
// 更新: CH-02フェーズ - 型安全性を強化し、一貫したプロパティ名に修正

import { createSelector } from 'reselect';
import type { RootState } from '../rootStore';
import { logger } from '@/utils/common';
import { type SymbolInfo, type SymbolFilterOptions, type SymbolChangeHistoryEntry } from '@/types/symbol/common';
import { ExchangeProductType } from '@/types/constants/enums';
import type { SymbolSliceState } from './state';

/**
 * シンボルスライス全体を取得する基本セレクター
 */
export const selectSymbolState = (state: RootState): SymbolSliceState => state as unknown as SymbolSliceState;

/**
 * 現在のシンボルを選択するセレクター
 * 注：他のセレクターとの名前衝突を避けるためにsymbol接頭辞を追加
 */
export const selectSymbolCurrentSymbol = (state: RootState): string => selectSymbolState(state).currentSymbol;

/**
 * 取引種別を選択するセレクター
 * 注：他のセレクターとの名前衝突を避けるためにsymbol接頭辞を追加
 */
export const selectSymbolExchangeType = (state: RootState): ExchangeProductType => selectSymbolState(state).exchangeType;

/**
 * すべてのシンボル情報を選択するセレクター
 */
export const selectSymbolList = (state: RootState): SymbolInfo[] => {
  return selectSymbolState(state).symbolsList;
};

/**
 * フィルタリングされたシンボル情報を選択するセレクター
 */
export const selectFilteredSymbols = (state: RootState): SymbolInfo[] => {
  return selectSymbolState(state).filteredSymbols;
};

/**
 * フィルターオプションを選択するセレクター
 */
export const selectSymbolFilterOptions = (state: RootState): SymbolFilterOptions => {
  return selectSymbolState(state).filterOptions;
};

/**
 * シンボルローディング状態を選択するセレクター
 */
export const selectIsLoadingSymbols = (state: RootState): boolean => {
  return selectSymbolState(state).isLoading;
};

/**
 * シンボルエラー状態を選択するセレクター
 */
export const selectSymbolError = (state: RootState): string | null => {
  return selectSymbolState(state).error;
};

/**
 * シンボル変更履歴を選択するセレクター
 */
export const selectSymbolChangeHistory = (state: RootState): SymbolChangeHistoryEntry[] => {
  return selectSymbolState(state).changeHistory;
};

/**
 * 特定のシンボルの詳細情報を選択するメモ化されたセレクター
 */
export const makeSelectSymbolInfo = () => 
  createSelector(
    [selectSymbolList, (_: RootState, symbolId: string) => symbolId],
    (symbols: SymbolInfo[], symbolId: string): SymbolInfo | undefined => {
      return symbols.find(s => s.symbol === symbolId);
    }
  );

/**
 * お気に入りのシンボルのみを選択するセレクター
 */
export const selectFavoriteSymbols = createSelector(
  [selectSymbolList],
  (symbols: SymbolInfo[]): SymbolInfo[] => {
    return symbols.filter(s => s.favorite);
  }
);

/**
 * 指定された基軸通貨のシンボルを選択するメモ化されたセレクター
 */
export const makeSelectSymbolsByQuoteAsset = () => 
  createSelector(
    [selectSymbolList, (_: RootState, quoteCoin: string) => quoteCoin],
    (symbols: SymbolInfo[], quoteCoin: string): SymbolInfo[] => {
      return symbols.filter(s => s.quoteCoin === quoteCoin);
    }
  );

/**
 * 利用可能なすべての基軸通貨を選択するセレクター
 */
export const selectQuoteAssets = createSelector(
  [selectSymbolList],
  (symbols: SymbolInfo[]): string[] => {
    return [...new Set(symbols.map(s => s.quoteCoin))];
  }
); 