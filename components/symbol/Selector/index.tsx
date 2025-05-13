/**
 * components/symbol/Selector/index.tsx
 * シンボルセレクターのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 */

"use client";

import { validateSymbolSelectorProps, type SymbolSelectorPropsSchema } from '@/lib/validations/symbol';
import { useFilterState, useSelectorStores, usePopularSymbols } from '@/hooks/symbol';

import ExchangeTabs from './ui/ExchangeTabs';
import SearchBar from './ui/SearchBar';
import FilterBar from './ui/FilterBar';
import PopularList from './ui/PopularList';
import SymbolList from './ui/SymbolList';

/**
 * シンボルセレクターのメインコンポーネント
 * 
 * 各サブコンポーネントを統合し、データの流れを管理します。
 * 
 * @param onSelect 銘柄選択時のコールバック
 * @param currentSymbol 現在選択されている銘柄
 * @param defaultExchangeType デフォルトの取引タイプ (spot/futures)
 * @param onExchangeTypeChange 取引タイプ変更時のコールバック
 */
export default function SymbolSelector({
  onSelect,
  currentSymbol = 'BTCUSDT',
  defaultExchangeType = 'spot',
  onExchangeTypeChange,
}: SymbolSelectorPropsSchema) {
  // プロパティのバリデーション
  const propsValidation = validateSymbolSelectorProps({
    onSelect,
    currentSymbol,
    defaultExchangeType,
    onExchangeTypeChange
  });
  
  if (!propsValidation.success) {
    console.warn('SymbolSelector props validation failed:', propsValidation.error);
  }
  
  // ストアから状態とアクションを取得
  const {
    symbols: { filteredSymbols, isLoading, error },
    actions: { toggleFavorite, retryFetch },
    exchangeType: { current: exchangeType, handleChange: handleExchangeTypeChange }
  } = useSelectorStores({
    defaultExchangeType,
    onExchangeTypeChange
  });
  
  // フィルター状態を管理するフックを使用
  const {
    filterOptions,
    commonQuoteAssets,
    handleSearch,
    handleQuoteAssetFilter,
    handleFavoritesToggle,
    resetFilters
  } = useFilterState();
  
  // 人気銘柄を取得
  const popularSymbols = usePopularSymbols({
    symbols: filteredSymbols,
    filterOptions
  });
  
  return (
    <div className="w-full space-y-4">
      {/* 取引タイプの選択 */}
      <ExchangeTabs
        currentExchangeType={exchangeType}
        onExchangeTypeChange={handleExchangeTypeChange}
      />
      
      {/* 検索フィールド */}
      <SearchBar
        searchTerm={filterOptions.searchTerm}
        onSearch={handleSearch}
      />
      
      {/* フィルターオプション */}
      <FilterBar
        filterOptions={filterOptions}
        commonQuoteAssets={commonQuoteAssets}
        onFavoritesToggle={handleFavoritesToggle}
        onQuoteAssetFilter={handleQuoteAssetFilter}
        onResetFilters={resetFilters}
      />
      
      {/* 人気銘柄セクション */}
      {!isLoading && (
        <PopularList
          symbols={popularSymbols}
          currentSymbol={currentSymbol}
          onSelect={onSelect}
          onToggleFavorite={toggleFavorite}
        />
      )}
      
      {/* 銘柄リスト */}
      <SymbolList
        symbols={filteredSymbols}
        isLoading={isLoading}
        error={error}
        currentSymbol={currentSymbol}
        onSelect={onSelect}
        onToggleFavorite={toggleFavorite}
        onRetry={retryFetch}
      />
    </div>
  );
} 