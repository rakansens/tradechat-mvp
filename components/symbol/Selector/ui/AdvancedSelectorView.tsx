/**
 * components/symbol/Selector/ui/AdvancedSelectorView.tsx
 * AdvancedSymbolSelector の表示専用コンポーネント
 */

"use client";

import { ExchangeTabs } from './ExchangeTabs';
import { SearchBar } from './SearchBar';
import { FilterBar } from './FilterBar';
import { PopularList } from './PopularList';
import { SymbolList } from './SymbolList';
import type { FilterOptions } from '@/services/symbol';
import type { SymbolInfo } from '@/types/common/symbol';
import type { ExchangeType } from '@/types/constants/enums';

interface AdvancedSelectorViewProps {
  exchangeType: ExchangeType;
  onExchangeTypeChange: (type: ExchangeType) => void;

  filterOptions: FilterOptions;
  commonQuoteAssets: string[];
  onSearch: (term: string) => void;
  onFavoritesToggle: () => void;
  onQuoteAssetFilter: (asset: string) => void;
  onResetFilters: () => void;

  popularSymbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  onSelect: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onRetry: () => void;

  selectedSymbol?: SymbolInfo;
  splitSymbol: { base: string; quote: string };
  onToggleCurrentFavorite: () => void;
}

export const AdvancedSelectorView = ({
  exchangeType,
  onExchangeTypeChange,
  filterOptions,
  commonQuoteAssets,
  onSearch,
  onFavoritesToggle,
  onQuoteAssetFilter,
  onResetFilters,
  popularSymbols,
  filteredSymbols,
  isLoading,
  error,
  currentSymbol,
  onSelect,
  onToggleFavorite,
  onRetry,
  selectedSymbol,
  splitSymbol,
  onToggleCurrentFavorite
}: AdvancedSelectorViewProps) => {
  return (
    <div className="w-full space-y-4">
      {/* 取引タイプの選択 */}
      <ExchangeTabs
        currentExchangeType={exchangeType}
        onExchangeTypeChange={onExchangeTypeChange}
      />

      {/* 検索フィールド */}
      <SearchBar searchTerm={filterOptions.searchTerm} onSearch={onSearch} />

      {/* フィルターオプション */}
      <FilterBar
        filterOptions={filterOptions}
        commonQuoteAssets={commonQuoteAssets}
        onFavoritesToggle={onFavoritesToggle}
        onQuoteAssetFilter={onQuoteAssetFilter}
        onResetFilters={onResetFilters}
      />

      {/* 人気銘柄セクション */}
      {!isLoading && popularSymbols.length > 0 && (
        <PopularList
          symbols={popularSymbols}
          currentSymbol={currentSymbol}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* 銘柄リスト */}
      <SymbolList
        symbols={filteredSymbols}
        isLoading={isLoading}
        error={error}
        currentSymbol={currentSymbol}
        onSelect={onSelect}
        onToggleFavorite={onToggleFavorite}
        onRetry={onRetry}
      />

      {/* 現在選択中の銘柄表示 */}
      {selectedSymbol && (
        <div className="flex items-center">
          <button
            className="mr-2 text-text-secondary hover:text-accent"
            onClick={onToggleCurrentFavorite}
            aria-label="お気に入りに追加/削除"
          >
            {selectedSymbol.favorite ? '★' : '☆'}
          </button>
          <div className="text-base font-medium">
            <span className="text-text-primary">{splitSymbol.base}</span>
            <span className="text-text-secondary">/{splitSymbol.quote}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSelectorView;
