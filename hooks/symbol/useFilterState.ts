/**
 * hooks/symbol/useFilterState.ts
 * シンボルセレクタのフィルター状態を管理するフック
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 */

import { useState, useEffect } from 'react';
import { useSymbolStore } from '@/store/useSymbolStore';
import { validateFilterOptions } from '@/lib/validations/symbol';

/**
 * シンボルセレクタのフィルター状態を管理するフック
 * 
 * - searchTerm: 検索語
 * - quoteAsset: 基軸通貨フィルター
 * - favoritesOnly: お気に入りのみ表示するかどうか
 * 
 * @returns フィルター状態とハンドラー関数
 */
export const useFilterState = () => {
  const { 
    setFilterOptions, 
    clearFilters, 
    filterOptions 
  } = useSymbolStore();
  
  // 一般的な基軸通貨
  const commonQuoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];
  
  // フィルターオプションのバリデーション
  useEffect(() => {
    const filterValidation = validateFilterOptions(filterOptions);
    if (!filterValidation.success) {
      console.warn('Filter options validation failed:', filterValidation.error);
    }
  }, [filterOptions]);

  // 検索処理
  const handleSearch = (term: string) => {
    // 検索語のバリデーション
    const searchTerm = term.trim();
    setFilterOptions({ searchTerm });
  };
  
  // 基軸通貨フィルター処理
  const handleQuoteAssetFilter = (asset: string) => {
    // 基軸通貨のバリデーション
    const quoteAsset = asset.trim();
    setFilterOptions({ quoteAsset });
  };
  
  // お気に入りフィルター処理
  const handleFavoritesToggle = () => {
    setFilterOptions({ favoritesOnly: !filterOptions.favoritesOnly });
  };
  
  // フィルターリセット
  const resetFilters = () => {
    clearFilters();
  };

  return {
    // 状態
    filterOptions,
    commonQuoteAssets,
    
    // ハンドラー
    handleSearch,
    handleQuoteAssetFilter,
    handleFavoritesToggle,
    resetFilters
  };
};

export default useFilterState; 