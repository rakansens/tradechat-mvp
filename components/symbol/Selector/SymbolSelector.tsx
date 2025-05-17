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
 * - 2025-06-05: selectSymbolCurrentSymbolをselectCurrentSymbolに変更
 * - 2025-06-05: T-7.7.1フェーズ - 型インポートパスを修正
 * - 2025-06-05: T-7.7.2フェーズ - 内部関数の名前衝突を解消
 * - 2025-06-05: T-7.7.3フェーズ - プロパティ名を統一（quoteCoin→quoteCoin、favorite→favorite）
 * - 2025-10-09: S-9.2フェーズ - ExchangeType型の参照を統一
 * - 2025-10-09: S-9.2フェーズ - FilterOptions型のインポートパス修正
 */

"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRootStore } from '@/store';
import { 
  selectCurrentSymbol, 
  selectExchangeType,
  selectFilteredSymbols,
  selectIsLoadingSymbols,
  selectSymbolError,
  selectQuoteAssets,
  selectSymbolFilterOptions,
  selectSymbolList
} from '@/store/barrel';
import type { SymbolInfo } from '@/types/common/symbol';
import type { FilterOptions } from '@/services/symbol';
import { logger } from '@/utils/common';

import { ExchangeTabs } from './ui/ExchangeTabs';
import { SearchBar } from './ui/SearchBar';
import { SymbolList } from './ui/SymbolList';
import { FilterBar } from './ui/FilterBar';
import { PopularList } from './ui/PopularList';
// アイコンは子コンポーネントで使用されるため、ここでのインポートは不要
import { type ExchangeType } from '@/types/constants/enums';
import { validateSymbolSelectorProps } from '@/lib/validations/symbol';
import type { SymbolSelectorPropsSchema } from '@/lib/validations/symbol';
import { symbolService } from '@/services/symbol';
import { safeExchangeType } from '@/utils/exchangeTypeUtils';

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
  const currentSymbol = useRootStore(selectCurrentSymbol);
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
                {symbol.symbol} ({symbol.baseCoin}/{symbol.quoteCoin})
                {symbol.favorite ? ' ★' : ''}
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
 * 内部で使用するためのフック (外部のuseFilterStateとは別)
 */
const useSymbolFilterState = () => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchTerm: '',
    quoteCoin: '',
    favoritesOnly: false
  });
  
  // よく使われる基軸通貨のリスト
  const commonQuoteAssets = ['USDT', 'BTC', 'ETH', 'USD', 'BUSD'];
  
  // 検索語句のハンドラー
  const handleSearch = useCallback((term: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, searchTerm: term }));
  }, []);
  
  // 基軸通貨フィルターのハンドラー
  const handleQuoteAssetFilter = useCallback((asset: string) => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, quoteCoin: asset }));
  }, []);
  
  // お気に入りフィルターのトグルハンドラー
  const handleFavoritesToggle = useCallback(() => {
    setFilterOptions((prev: FilterOptions) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));
  }, []);
  
  // フィルターリセットハンドラー
  const resetFilters = useCallback(() => {
    setFilterOptions({
      searchTerm: '',
      quoteCoin: '',
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
  const error = useRootStore(selectSymbolError);
  
  // ストアからアクションを取得
  const toggleFavorite = useRootStore(state => state.toggleFavorite);
  const fetchSymbols = useRootStore(state => state.fetchSymbols);
  const setProductType = useRootStore(state => state.setProductType);
  const currentExchangeType = useRootStore(state => state.exchangeType);
  
  // 取引タイプの変更ハンドラー
  const handleExchangeTypeChange = useCallback((type: ExchangeType) => {
    setProductType(type);
    
    // コールバックが提供されている場合、外部に変更を通知
    if (options.onExchangeTypeChange) {
      options.onExchangeTypeChange(type);
    }
  }, [setProductType, options.onExchangeTypeChange]);
  
  // 再試行ハンドラー
  const retryFetch = useCallback(() => {
    fetchSymbols(currentExchangeType);
  }, [fetchSymbols, currentExchangeType]);
  
  // デフォルトの取引タイプが指定されていれば設定
  useEffect(() => {
    if (options.defaultExchangeType && options.defaultExchangeType !== currentExchangeType) {
        setProductType(options.defaultExchangeType);
    }
  }, [options.defaultExchangeType, currentExchangeType, setProductType]);
  
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
    const favorites = symbols.filter(s => s.favorite);
    
    // もし現在のフィルターがお気に入りのみの場合は、空の配列を返す
    // (PopularListとSymbolListが重複してしまうため)
    if (filterOptions.favoritesOnly) {
      return [];
    }
    
    // お気に入りが3つ以下なら主要な銘柄を追加
    if (favorites.length <= 3) {
      const mainSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
      const popularByName = symbols.filter(s => 
        !s.favorite && mainSymbols.some(name => 
          s.baseCoin === name && (
            !filterOptions.quoteCoin || s.quoteCoin === filterOptions.quoteCoin
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
 * @param defaultExchangeType デフォルトの取引タイプ
 * @param onExchangeTypeChange 取引タイプ変更時のコールバック
 */
export default function AdvancedSymbolSelector({
  onSelect,
  currentSymbol = 'BTCUSDT',
  defaultExchangeType = 'bitget',
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
  const filterState = useSymbolFilterState();
  const {
    filterOptions,
    commonQuoteAssets,
    handleSearch,
    handleQuoteAssetFilter,
    handleFavoritesToggle,
    resetFilters
  } = filterState;
  
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

  // 現在選択されているシンボルを探す
  const selectedSymbol = useMemo(() => {
    return filteredSymbols.find(s => s.symbol === currentSymbol);
  }, [filteredSymbols, currentSymbol]);
  
  // 分割シンボル表示（シンボル文字列からベースとクォートを抽出）
  const splitSymbol = useMemo(() => {
    // 選択されたシンボルオブジェクトが見つかった場合
    if (selectedSymbol) {
      return {
        base: selectedSymbol.baseCoin,
        quote: selectedSymbol.quoteCoin
      };
    }
    
    // なければ文字列を分割して推測
    const parts = currentSymbol.split('/');
    if (parts.length === 2) {
      return { base: parts[0], quote: parts[1] };
    }
    
    // BTCUSDT形式の場合は推測して分割
    // 一般的な取引通貨
    const quoteCurrencies = ['USDT', 'USD', 'BTC', 'ETH', 'BNB'];
    for (const quote of quoteCurrencies) {
      if (currentSymbol.endsWith(quote)) {
        return {
          base: currentSymbol.slice(0, currentSymbol.length - quote.length),
          quote
        };
      }
    }
    
    // 分割できない場合
    return { base: currentSymbol, quote: "" };
  }, [selectedSymbol, currentSymbol]);
  
  // お気に入りトグルハンドラー
  const handleToggleFavorite = useCallback(() => {
    if (selectedSymbol) {
      toggleFavorite(selectedSymbol.symbol);
    }
  }, [selectedSymbol, toggleFavorite]);

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

      {/* 現在選択中の銘柄表示 */}
      {selectedSymbol && (
        <div className="flex items-center">
          <button
            className="mr-2 text-text-secondary hover:text-accent"
            onClick={handleToggleFavorite}
            aria-label="お気に入りに追加/削除"
          >
            {selectedSymbol.favorite ? 
              "★" : 
              "☆"
            }
          </button>
          <div className="text-base font-medium">
            <span className="text-text-primary">{splitSymbol.base}</span>
            <span className="text-text-secondary">/{splitSymbol.quote}</span>
          </div>
        </div>
      )}
    </div>
  );
} 