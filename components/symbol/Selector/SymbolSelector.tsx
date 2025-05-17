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

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRootStore } from '@/store';
import {
  selectCurrentSymbol,
  selectFilteredSymbols,
  selectIsLoadingSymbols,
  selectSymbolError,
  selectSymbolList
} from '@/store/barrel';
import type { SymbolInfo } from '@/types/common/symbol';
import type { FilterOptions } from '@/services/symbol';
import { logger } from '@/utils/common';

import { AdvancedSelectorView } from './ui/AdvancedSelectorView';
// アイコンは子コンポーネントで使用されるため、ここでのインポートは不要
import { type ExchangeType } from '@/types/constants/enums';
import { validateSymbolSelectorProps } from '@/lib/validations/symbol';
import type { SymbolSelectorPropsSchema } from '@/lib/validations/symbol';
import {
  useSymbolFilterState,
  useSymbolSelectorLogic,
  useAdvancedPopularSymbols
} from '@/hooks/symbol/selector';

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
  } = useSymbolSelectorLogic({
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
  const popularSymbols = useAdvancedPopularSymbols({
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
    <AdvancedSelectorView
      exchangeType={exchangeType}
      onExchangeTypeChange={handleExchangeTypeChange}
      filterOptions={filterOptions}
      commonQuoteAssets={commonQuoteAssets}
      onSearch={handleSearch}
      onFavoritesToggle={handleFavoritesToggle}
      onQuoteAssetFilter={handleQuoteAssetFilter}
      onResetFilters={resetFilters}
      popularSymbols={popularSymbols}
      filteredSymbols={filteredSymbols}
      isLoading={isLoading}
      error={error}
      currentSymbol={currentSymbol}
      onSelect={handleSymbolSelect}
      onToggleFavorite={toggleFavorite}
      onRetry={retryFetch}
      selectedSymbol={selectedSymbol}
      splitSymbol={splitSymbol}
      onToggleCurrentFavorite={handleToggleFavorite}
    />
  );
}
