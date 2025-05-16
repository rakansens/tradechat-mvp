// store/symbol/selectors.ts
// u4f5cu6210: SymbolSliceu306eu30bbu30ecu30afu30bfu30fc
// u66f4u65b0: u578bu30a8u30e9u30fcu3092u4feeu6b63
// u66f4u65b0: u30bbu30ecu30afu30bfu30fcu540du306eu885du7a81u3092u89e3u6c7a
// u66f4u65b0: u30d7u30edu30d1u30c6u30a3u540du5909u66f4u306bu5408u308fu305bu305fu4feeu6b63
// u66f4u65b0: u30b7u30f3u30dcu30ebu30b9u30e9u30a4u30b9u306eu30bbu30ecu30afu30bfu95a2u6570u3092u5b9au7fa9u3059u308b
// u66f4u65b0: T-7.6u30d5u30a7u30fcu30ba - u578bu30a4u30f3u30ddu30fcu30c8u30d1u30b9u306eu4feeu6b63
// u66f4u65b0: T-7.7u30d5u30a7u30fcu30ba - u30d7u30edu30d1u30c6u30a3u540du3092u7d71u4e00uff08quoteAssetu2192quoteCoinu3001isFavoriteu2192favoriteuff09

import { createSelector } from 'reselect';
import type { RootStore } from '../rootStore';
import { logger } from '@/utils/common';
import { type SymbolInfo, type FilterOptions, type SymbolChangeHistory } from '@/services/symbol';
import { ExchangeType } from '@/types/network/api';

/**
 * u73feu5728u306eu30b7u30f3u30dcu30ebu3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 * u6ce8uff1au4ed6u306eu30bbu30ecu30afu30bfu30fcu3068u306eu540du524du885du7a81u3092u907fu3051u308bu305fu3081u306bsymbolu63a5u982du8f9eu3092u8ffdu52a0
 */
export const selectSymbolCurrentSymbol = (state: RootStore): string => state.currentSymbol;

/**
 * u53d6u5f15u7a2eu5225u3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 * u6ce8uff1au4ed6u306eu30bbu30ecu30afu30bfu30fcu3068u306eu540du524du885du7a81u3092u907fu3051u308bu305fu3081u306bsymbolu63a5u982du8f9eu3092u8ffdu52a0
 */
export const selectSymbolExchangeType = (state: RootStore) => state.exchangeType;

/**
 * u3059u3079u3066u306eu30b7u30f3u30dcu30ebu60c5u5831u3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 * u6ce8uff1au578bu4e92u63dbu6027u306eu305fu3081u306bu30a2u30b5u30fcu30b7u30e7u30f3u3092u4f7fu7528
 */
export const selectSymbolList = (state: RootStore) => {
  return 'symbolsList' in state 
    ? (state as any).symbolsList as SymbolInfo[]
    : [] as SymbolInfo[];
};

/**
 * u30d5u30a3u30ebu30bfu30eau30f3u30b0u3055u308cu305fu30b7u30f3u30dcu30ebu60c5u5831u3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 * u6ce8uff1aRootStoreu306bu7d71u5408u3055u308cu308bu307eu3067u306eu4e00u6642u7684u306au5bfeu5fdc
 */
export const selectFilteredSymbols = (state: RootStore) => {
  return 'filteredSymbols' in state 
    ? (state as any).filteredSymbols as SymbolInfo[]
    : [] as SymbolInfo[];
};

/**
 * u30d5u30a3u30ebu30bfu30fcu30aau30d7u30b7u30e7u30f3u3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 * u6ce8uff1aRootStoreu306bu7d71u5408u3055u308cu308bu307eu3067u306eu4e00u6642u7684u306au5bfeu5fdc
 */
export const selectSymbolFilterOptions = (state: RootStore) => {
  return 'symbolFilterOptions' in state
    ? (state as any).symbolFilterOptions as FilterOptions
    : { searchTerm: '', quoteAsset: '', favoritesOnly: false } as FilterOptions;
};

/**
 * u30b7u30f3u30dcu30ebu30edu30fcu30c7u30a3u30f3u30b0u72b6u614bu3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 */
export const selectIsLoadingSymbols = (state: RootStore): boolean => {
  return 'isLoadingSymbols' in state ? (state as any).isLoadingSymbols : false;
};

/**
 * u30b7u30f3u30dcu30ebu30a8u30e9u30fcu72b6u614bu3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 */
export const selectSymbolError = (state: RootStore): string | null => {
  return 'symbolError' in state ? (state as any).symbolError : null;
};

/**
 * u30b7u30f3u30dcu30ebu5909u66f4u5c65u6b74u3092u9078u629eu3059u308bu30bbu30ecu30afu30bfu30fc
 */
export const selectSymbolChangeHistory = (state: RootStore): SymbolChangeHistory[] => {
  return 'symbolChangeHistory' in state ? (state as any).symbolChangeHistory : [];
};

/**
 * u7279u5b9au306eu30b7u30f3u30dcu30ebu306eu8a73u7d30u60c5u5831u3092u9078u629eu3059u308bu30e1u30e2u5316u3055u308cu305fu30bbu30ecu30afu30bfu30fc
 */
export const makeSelectSymbolInfo = () => 
  createSelector(
    [selectSymbolList, (_: RootStore, symbolId: string) => symbolId],
    (symbols: SymbolInfo[], symbolId: string): SymbolInfo | undefined => {
      return symbols.find(s => s.symbol === symbolId);
    }
  );

/**
 * u304au6c17u306bu5165u308au30b7u30f3u30dcu30ebu306eu307fu3092u9078u629eu3059u308bu30e1u30e2u5316u3055u308cu305fu30bbu30ecu30afu30bfu30fc
 */
export const selectFavoriteSymbols = createSelector(
  [selectSymbolList],
  (symbols) => symbols.filter(symbol => symbol.favorite)
);

/**
 * u6307u5b9au3055u308cu305fu57fau8ef8u901au8ca8u306eu30b7u30f3u30dcu30ebu3092u9078u629eu3059u308bu30e1u30e2u5316u3055u308cu305fu30bbu30ecu30afu30bfu30fc
 */
export const makeSelectSymbolsByQuoteAsset = () => 
  createSelector(
    [selectSymbolList, (_: RootStore, quoteAsset: string) => quoteAsset],
    (symbols: SymbolInfo[], quoteAsset: string): SymbolInfo[] => {
      return symbols.filter(s => s.quoteCoin === quoteAsset);
    }
  );

/**
 * u57fau8ef8u901au8ca8u306eu4e00u89a7u3092u9078u629eu3059u308bu30e1u30e2u5316u3055u308cu305fu30bbu30ecu30afu30bfu30fc
 */
export const selectQuoteAssets = createSelector(
  [selectSymbolList],
  (symbols: SymbolInfo[]): string[] => {
    // u91cdu8907u3092u6392u9664u3057u3066u57fau8ef8u901au8ca8u306eu4e00u89a7u3092u53d6u5f97
    const quoteAssets = new Set(symbols.map(s => s.quoteCoin));
    return Array.from(quoteAssets).sort();
  }
); 