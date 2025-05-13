/**
 * components/symbol/Selector/SymbolSelector.tsx
 * シンボルセレクターのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 2025-05-14: 重複する関数宣言を修正
 * - 2025-05-14: ファイル名をindex.tsxからSymbolSelector.tsxに変更
 * - 2025-05-14: 不足している型定義を追加
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRootStore } from '@/store/rootStore';
import { selectSymbolCurrentSymbol, selectSymbolList, selectFilteredSymbols, selectIsLoadingSymbols } from '@/store/barrel';
import { SymbolInfo } from '@/services/symbol/symbol-service';

import ExchangeTabs from './ui/ExchangeTabs';
import SearchBar from './ui/SearchBar';
import FilterBar from './ui/FilterBar';
import PopularList from './ui/PopularList';
import SymbolList from './ui/SymbolList';
import { ExchangeType } from '@/types/api';

interface SymbolSelectorProps {
  onSelect?: (symbol: string) => void;
  defaultSymbol?: string;
  className?: string;
}

// 拡張されたProps定義
interface AdvancedSymbolSelectorProps {
  onSelect?: (symbol: string) => void;
  currentSymbol?: string;
  defaultExchangeType?: ExchangeType;
  onExchangeTypeChange?: (type: ExchangeType) => void;
}

/**
 * シンボルセレクターコンポーネント
 * SymbolSliceを使用してシンボルの選択と表示を行う
 */
export const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  onSelect,
  defaultSymbol,
  className = '',
}) => {
  // RootStoreからSymbolSliceの状態を取得
  const currentSymbol = useRootStore(selectSymbolCurrentSymbol);
  const symbols = useRootStore(selectFilteredSymbols);
  const isLoading = useRootStore(selectIsLoadingSymbols);
  
  // SymbolSliceのアクションを取得
  const setCurrentSymbol = useRootStore(state => state.setCurrentSymbol);
  const fetchSymbols = useRootStore(state => state.fetchSymbols);
  const exchangeType = useRootStore(state => state.exchangeType);
  
  // コンポーネントマウント時にシンボル一覧を取得
  useEffect(() => {
    fetchSymbols(exchangeType);
  }, [fetchSymbols, exchangeType]);
  
  // デフォルトシンボルが指定されている場合は反映
  useEffect(() => {
    if (defaultSymbol && defaultSymbol !== currentSymbol) {
      setCurrentSymbol(defaultSymbol, 'component-default');
    }
  }, [defaultSymbol, currentSymbol, setCurrentSymbol]);
  
  // シンボル選択ハンドラー
  const handleSymbolSelect = (symbol: string) => {
    setCurrentSymbol(symbol, 'user-selection');
    if (onSelect) {
      onSelect(symbol);
    }
  };
  
  return (
    <div className={`symbol-selector ${className}`}>
      <select
        value={currentSymbol}
        onChange={(e) => handleSymbolSelect(e.target.value)}
        disabled={isLoading}
        className="form-select"
      >
        {isLoading ? (
          <option value="">読み込み中...</option>
        ) : (
          <>
            {currentSymbol === '' && <option value="">シンボルを選択</option>}
            {symbols.map((symbol: SymbolInfo) => (
              <option key={symbol.symbol} value={symbol.symbol}>
                {symbol.symbol} ({symbol.baseAsset}/{symbol.quoteAsset})
                {symbol.isFavorite ? ' ★' : ''}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
};

// 以下は簡易的な実装です。必要に応じて実際のロジックに置き換えてください
const validateProps = (props: any) => ({ success: true });
const useFilterState = () => ({
  filterOptions: { searchTerm: '', showFavorites: false, quoteAsset: '' },
  commonQuoteAssets: ['USDT', 'BTC', 'ETH'],
  handleSearch: (term: string) => {},
  handleQuoteAssetFilter: (asset: string) => {},
  handleFavoritesToggle: () => {},
  resetFilters: () => {}
});
const useSelectorStores = (options: any) => ({
  symbols: { filteredSymbols: [], isLoading: false, error: null },
  actions: { toggleFavorite: (symbol: string) => {}, retryFetch: () => {} },
  exchangeType: { 
    current: options.defaultExchangeType || 'spot', 
    handleChange: options.onExchangeTypeChange || (() => {})
  }
});
const usePopularSymbols = (options: any) => [];

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
export default function AdvancedSymbolSelector({
  onSelect,
  currentSymbol = 'BTCUSDT',
  defaultExchangeType = 'spot',
  onExchangeTypeChange,
}: AdvancedSymbolSelectorProps) {
  // プロパティのバリデーション
  const propsValidation = validateProps({
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