/**
 * hooks/symbol/selector/useSymbolFilterState.ts
 * SymbolSelector のフィルター状態を管理する内部用フック
 */

import { useState, useCallback } from 'react';
import type { FilterOptions } from '@/services/symbol';

/**
 * フィルター状態を管理するフック
 * 外部公開されている useFilterState とは独立して動作する
 */
export const useSymbolFilterState = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    search: '',
    quoteAsset: '',
    showFavoritesOnly: false
  });

  // よく使われる基軸通貨のリスト
  const commonQuoteAssets = ['USDT', 'BTC', 'ETH', 'USD', 'BUSD'];

  // 検索語句のハンドラー
  const handleSearch = useCallback((term: string) => {
    setFilterOptions(prev => ({ ...prev, search: term }));
  }, []);

  // 基軸通貨フィルターのハンドラー
  const handleQuoteAssetFilter = useCallback((asset: string) => {
    setFilterOptions(prev => ({ ...prev, quoteAsset: asset }));
  }, []);

  // お気に入りフィルターのトグルハンドラー
  const handleFavoritesToggle = useCallback(() => {
    setFilterOptions(prev => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }));
  }, []);

  // フィルターリセットハンドラー
  const resetFilters = useCallback(() => {
    setFilterOptions({
      search: '',
      quoteAsset: '',
      showFavoritesOnly: false
    });
  }, []);

  return {
    filterOptions,
    commonQuoteAssets,
    handleSearch,
    handleQuoteAssetFilter,
    handleFavoritesToggle,
    resetFilters
  };
};

export default useSymbolFilterState;
