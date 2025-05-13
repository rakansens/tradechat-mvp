/**
 * components/symbol/Selector/SymbolSelector.tsx
 * シンボルセレクターのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 2025-05-14: 重複する関数宣言を修正
 * - 2025-05-14: ファイル名をindex.tsxからSymbolSelector.tsxに変更
 * - 2025-05-14: 不足している型定義を追加
 * - 2025-05-14: モック実装を実際の実装に置き換え
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRootStore } from '@/store/rootStore';
import { 
  selectSymbolCurrentSymbol, 
  selectSymbolList, 
  selectFilteredSymbols, 
  selectIsLoadingSymbols
} from '@/store/barrel';
import { SymbolInfo } from '@/services/symbol/symbol-service';
import { logger } from '@/utils/logger';

import ExchangeTabs from './ui/ExchangeTabs';
import SearchBar from './ui/SearchBar';
import FilterBar from './ui/FilterBar';
import PopularList from './ui/PopularList';
import SymbolList from './ui/SymbolList';
import { ExchangeType } from '@/types/api';
import { FilterOptions } from '@/store/useSymbolStore';
import { validateSymbolSelectorProps } from '@/lib/validations/symbol';
import type { SymbolSelectorPropsSchema } from '@/lib/validations/symbol';

interface SymbolSelectorProps {
  onSelect?: (symbol: string) => void;
  defaultSymbol?: string;
  className?: string;
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

/**
 * フィルター状態を管理するフック
 */
const useFilterState = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: '',
    quoteAsset: '',
    favoritesOnly: false
  });
  
  // よく使われる基軸通貨のリスト
  const commonQuoteAssets = ['USDT', 'BTC', 'ETH', 'USD', 'BUSD'];
  
  // 検索語句のハンドラー
  const handleSearch = useCallback((term: string) => {
    setFilterOptions(prev => ({ ...prev, searchTerm: term }));
  }, []);
  
  // 基軸通貨フィルターのハンドラー
  const handleQuoteAssetFilter = useCallback((asset: string) => {
    setFilterOptions(prev => ({ ...prev, quoteAsset: asset }));
  }, []);
  
  // お気に入りフィルターのトグルハンドラー
  const handleFavoritesToggle = useCallback(() => {
    setFilterOptions(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));
  }, []);
  
  // フィルターリセットハンドラー
  const resetFilters = useCallback(() => {
    setFilterOptions({
      searchTerm: '',
      quoteAsset: '',
      favoritesOnly: false
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

/**
 * セレクターで使用するストアのロジックを管理するフック
 */
const useSelectorStores = (options: {
  defaultExchangeType?: ExchangeType;
  onExchangeTypeChange?: (type: ExchangeType) => void;
}) => {
  // RootStoreから状態を取得
  const symbols = useRootStore(selectFilteredSymbols);
  const allSymbols = useRootStore(selectSymbolList);
  const isLoading = useRootStore(selectIsLoadingSymbols);
  const error = useRootStore(state => state.symbolError);
  
  // ストアからアクションを取得
  const toggleFavorite = useRootStore(state => state.toggleFavorite);
  const fetchSymbols = useRootStore(state => state.fetchSymbols);
  const setExchangeType = useRootStore(state => state.setExchangeType);
  const currentExchangeType = useRootStore(state => state.exchangeType);
  
  // 取引タイプの変更ハンドラー
  const handleExchangeTypeChange = useCallback((type: ExchangeType) => {
    setExchangeType(type);
    
    // コールバックが提供されている場合、外部に変更を通知
    if (options.onExchangeTypeChange) {
      options.onExchangeTypeChange(type);
    }
  }, [setExchangeType, options.onExchangeTypeChange]);
  
  // 再試行ハンドラー
  const retryFetch = useCallback(() => {
    fetchSymbols(currentExchangeType);
  }, [fetchSymbols, currentExchangeType]);
  
  // デフォルトの取引タイプが指定されていれば設定
  useEffect(() => {
    if (options.defaultExchangeType && options.defaultExchangeType !== currentExchangeType) {
      setExchangeType(options.defaultExchangeType);
    }
  }, [options.defaultExchangeType, currentExchangeType, setExchangeType]);
  
  return {
    symbols: { filteredSymbols: symbols, isLoading, error },
    actions: { toggleFavorite, retryFetch },
    exchangeType: { current: currentExchangeType, handleChange: handleExchangeTypeChange }
  };
};

/**
 * 人気銘柄を取得するフック
 */
const usePopularSymbols = (options: {
  symbols: SymbolInfo[];
  filterOptions: FilterOptions;
}) => {
  const { symbols, filterOptions } = options;
  
  // 人気銘柄の基準：お気に入りかつ取引量が多い、または最近追加された上位銘柄
  const popularSymbols = useMemo(() => {
    // お気に入りの銘柄を優先的に取得
    const favorites = symbols.filter(s => s.isFavorite);
    
    // もし現在のフィルターがお気に入りのみの場合は、空の配列を返す
    // (PopularListとSymbolListが重複してしまうため)
    if (filterOptions.favoritesOnly) {
      return [];
    }
    
    // お気に入りが3つ以下なら主要な銘柄を追加
    if (favorites.length <= 3) {
      const mainSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
      const popularByName = symbols.filter(s => 
        !s.isFavorite && mainSymbols.some(name => 
          s.baseAsset === name && (
            !filterOptions.quoteAsset || s.quoteAsset === filterOptions.quoteAsset
          )
        )
      );
      
      // 重複を除去して返す
      return [...favorites, ...popularByName].slice(0, 6);
    }
    
    // お気に入りが十分あれば、それらのみを返す（最大6つ）
    return favorites.slice(0, 6);
  }, [symbols, filterOptions]);
  
  return popularSymbols;
};

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
}: SymbolSelectorPropsSchema) {
  // プロパティのバリデーション
  const propsValidation = validateSymbolSelectorProps({
    onSelect,
    currentSymbol,
    defaultExchangeType,
    onExchangeTypeChange
  });
  
  if (!propsValidation.success) {
    logger.warn('SymbolSelector props validation failed', {
      component: 'AdvancedSymbolSelector',
      error: propsValidation.error
    });
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
  
  // 実際のonSelect関数（オプショナルな関数を型安全に処理）
  const handleSymbolSelect = useCallback((symbol: string) => {
    if (onSelect) {
      onSelect(symbol);
    }
  }, [onSelect]);
  
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
      {!isLoading && popularSymbols.length > 0 && (
        <PopularList
          symbols={popularSymbols}
          currentSymbol={currentSymbol}
          onSelect={handleSymbolSelect}
          onToggleFavorite={toggleFavorite}
        />
      )}
      
      {/* 銘柄リスト */}
      <SymbolList
        symbols={filteredSymbols}
        isLoading={isLoading}
        error={error}
        currentSymbol={currentSymbol}
        onSelect={handleSymbolSelect}
        onToggleFavorite={toggleFavorite}
        onRetry={retryFetch}
      />
    </div>
  );
} 