/**
 * components/symbol/Selector/ui/FilterBar.tsx
 * 銘柄フィルターバーコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 2025-05-17: T-7.6フェーズ - 型インポートパスを修正
 * - 2025-06-05: T-7.7.1フェーズ - FilterOptions型のプロパティを修正
 */

"use client";

import { Button } from '@/components/ui/button';
import { Star, StarOff } from 'lucide-react';
import type { StoreFilterOptions } from '@/types/store/symbol';

interface FilterBarProps {
  filterOptions: StoreFilterOptions;
  commonQuoteAssets: string[];
  onFavoritesToggle: () => void;
  onQuoteAssetFilter: (asset: string) => void;
  onResetFilters: () => void;
}

/**
 * 銘柄フィルターバーコンポーネント
 * 
 * お気に入りフィルターボタン、基軸通貨フィルターボタン群、リセットボタンを提供します。
 */
export const FilterBar = ({
  filterOptions,
  commonQuoteAssets,
  onFavoritesToggle,
  onQuoteAssetFilter,
  onResetFilters
}: FilterBarProps) => {
  const isFiltersActive = filterOptions.search || filterOptions.quoteAsset || filterOptions.showFavoritesOnly;
  
  return (
    <>
      {/* お気に入りフィルター */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filterOptions.showFavoritesOnly ? "default" : "outline"}
          size="sm" 
          onClick={onFavoritesToggle}
          className="flex gap-1"
        >
          {filterOptions.showFavoritesOnly ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
          お気に入り
        </Button>
        
        {isFiltersActive && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onResetFilters}
          >
            フィルターをクリア
          </Button>
        )}
      </div>
      
      {/* 基軸通貨フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={!filterOptions.quoteAsset ? "default" : "outline"}
          size="sm" 
          onClick={() => onQuoteAssetFilter('')}
        >
          すべて
        </Button>
        
        {commonQuoteAssets.map(asset => (
          <Button
            key={asset}
            variant={filterOptions.quoteAsset === asset ? "default" : "outline"}
            size="sm"
            onClick={() => onQuoteAssetFilter(asset)}
          >
            {asset}
          </Button>
        ))}
      </div>
    </>
  );
};

export default FilterBar; 