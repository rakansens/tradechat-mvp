/**
 * hooks/symbol/filter/useFilterState.ts
 * シンボルセレクタのフィルター状態を管理するフック
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: リファクタリングによりhooks/symbol/filter/に移動
 */

import { useState, useEffect } from 'react';
// 古いインポートを削除
// import { useSymbolStore } from '@/store/useSymbolStore';
import { useRootStore } from '@/store/rootStore';
import { selectSymbolFilterOptions } from '@/store/barrel';
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
  // SymbolSliceからアクションと状態を取得
  const setFilterOptions = useRootStore(state => state.setFilterOptions);
  const clearFilters = useRootStore(state => state.clearFilters);
  const filterOptions = useRootStore(selectSymbolFilterOptions);
  
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