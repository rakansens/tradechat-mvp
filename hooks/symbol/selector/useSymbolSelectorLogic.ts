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
  selectSymbolError,
  selectSymbolExchangeType
} from '@/store/barrel';
import type { ProductType } from '@/types/constants/enums';
import { toProductType } from '@/utils/exchangeTypeUtils';

interface UseSymbolSelectorLogicOptions {
  defaultProductType?: ProductType;
  onProductTypeChange?: (type: ProductType) => void;
}

/**
 * セレクターで使用するストアのロジックを管理するフック
 */
export const useSymbolSelectorLogic = ({
  defaultProductType,
  onProductTypeChange
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
  // Product type is stored under exchangeProductType in the store
  const currentProductType = useRootStore(selectSymbolExchangeType);

  // 取引タイプの変更ハンドラー
  const handleProductTypeChange = useCallback(
    (type: ProductType) => {
      setProductType(type);
      if (onProductTypeChange) {
        onProductTypeChange(type);
      }
    },
    [setProductType, onProductTypeChange]
  );

  // 再試行ハンドラー
  const retryFetch = useCallback(() => {
    fetchSymbols(currentProductType);
  }, [fetchSymbols, currentProductType]);

  // デフォルトの取引タイプが指定されていれば設定
  useEffect(() => {
    const normalizedDefault = defaultProductType ? toProductType(defaultProductType) : undefined;
    const normalizedCurrent = toProductType(currentProductType);
    if (normalizedDefault && normalizedDefault !== normalizedCurrent) {
      setProductType(normalizedDefault);
    }
  }, [defaultProductType, currentProductType, setProductType]);

  return {
    symbols: { filteredSymbols: symbols, isLoading, error },
    actions: { toggleFavorite, retryFetch },
    productType: { current: currentProductType, handleChange: handleProductTypeChange }
  };
};

export default useSymbolSelectorLogic;
