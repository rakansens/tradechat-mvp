/**
 * hooks/symbol/selector/useSymbolSelectorLogic.ts
 * SymbolSelector で利用するストア操作とデータ取得をまとめたフック
 */

import { useEffect, useCallback } from 'react';
import { useRootStore } from '@/store';
import {
  selectFilteredSymbols,
  selectSymbolList,
  selectIsLoadingSymbols,
  selectSymbolError
} from '@/store/barrel';
import type { ExchangeType } from '@/types/constants/enums';

interface UseSymbolSelectorLogicOptions {
  defaultExchangeType?: ExchangeType;
  onExchangeTypeChange?: (type: ExchangeType) => void;
}

/**
 * セレクターで使用するストアのロジックを管理するフック
 */
export const useSymbolSelectorLogic = ({
  defaultExchangeType,
  onExchangeTypeChange
}: UseSymbolSelectorLogicOptions = {}) => {
  // RootStoreから状態を取得
  const symbols = useRootStore(selectFilteredSymbols);
  const allSymbols = useRootStore(selectSymbolList); // 現状未使用だが保持
  const isLoading = useRootStore(selectIsLoadingSymbols);
  const error = useRootStore(selectSymbolError);

  // ストアからアクションを取得
  const toggleFavorite = useRootStore(state => state.toggleFavorite);
  const fetchSymbols = useRootStore(state => state.fetchSymbols);
  const setProductType = useRootStore(state => state.setProductType);
  const currentExchangeType = useRootStore(state => state.exchangeType);

  // 取引タイプの変更ハンドラー
  const handleExchangeTypeChange = useCallback(
    (type: ExchangeType) => {
      setProductType(type);
      if (onExchangeTypeChange) {
        onExchangeTypeChange(type);
      }
    },
    [setProductType, onExchangeTypeChange]
  );

  // 再試行ハンドラー
  const retryFetch = useCallback(() => {
    fetchSymbols(currentExchangeType);
  }, [fetchSymbols, currentExchangeType]);

  // デフォルトの取引タイプが指定されていれば設定
  useEffect(() => {
    if (defaultExchangeType && defaultExchangeType !== currentExchangeType) {
      setProductType(defaultExchangeType);
    }
  }, [defaultExchangeType, currentExchangeType, setProductType]);

  return {
    symbols: { filteredSymbols: symbols, isLoading, error },
    actions: { toggleFavorite, retryFetch },
    exchangeType: { current: currentExchangeType, handleChange: handleExchangeTypeChange }
  };
};

export default useSymbolSelectorLogic;
