/**
 * hooks/symbol/selector/useSelectorStores.ts
 * シンボルセレクタで使用するストアのデータとアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 * - 更新: リファクタリングによりhooks/symbol/selector/に移動
 */

import { useState, useEffect, useCallback } from 'react';
import { useRootStore } from '@/store/rootStore';
import { 
  selectFilteredSymbols, 
  selectIsLoadingSymbols, 
  selectSymbolError 
} from '@/store/barrel';
import { ExchangeType, ExchangeProductType } from '@/types/constants/enums';

interface UseSelectorStoresProps {
  defaultExchangeType?: ExchangeProductType;
  onExchangeTypeChange?: (type: ExchangeProductType) => void;
}

/**
 * シンボルセレクタで使用するストアのデータとアクションを集約するフック
 * 
 * - 銘柄データ: filteredSymbols, isLoadingSymbols, symbolError
 * - アクション: fetchSymbols, toggleFavorite
 * - 取引タイプ(exchangeType)の管理
 * 
 * @param defaultExchangeType デフォルトの取引タイプ (spot/futures)
 * @param onExchangeTypeChange 取引タイプ変更時のコールバック
 * @returns ストアのデータとアクション、取引タイプの状態と制御関数
 */
export const useSelectorStores = ({
  defaultExchangeType = 'spot',
  onExchangeTypeChange
}: UseSelectorStoresProps = {}) => {
  // SymbolSliceから状態とアクションを取得
  const filteredSymbols = useRootStore(selectFilteredSymbols);
  const isLoading = useRootStore(selectIsLoadingSymbols);
  const error = useRootStore(selectSymbolError);
  const fetchSymbols = useRootStore(state => state.fetchSymbols);
  const toggleFavorite = useRootStore(state => state.toggleFavorite);
  
  // 取引タイプの状態
  const [exchangeType, setExchangeType] = useState<ExchangeProductType>(defaultExchangeType || 'spot');
  
  // ExchangeProductTypeをExchangeTypeに変換するヘルパー関数
  const toExchangeType = useCallback((productType: ExchangeProductType): ExchangeType => {
    // ここではデフォルトで'bitget'を使用するが、必要に応じてロジックを変更可能
    return 'bitget';
  }, []);

  // 取引タイプ変更のハンドラー
  const handleExchangeTypeChange = (value: string) => {
    if (value !== 'spot' && value !== 'futures') {
      console.warn(`Invalid exchange product type: ${value}, defaulting to 'spot'`);
      value = 'spot';
    }
    const newType = value as ExchangeProductType;
    setExchangeType(newType);
    
    // ExchangeProductTypeをExchangeTypeに変換してfetchSymbolsを呼び出す
    const exchangeTypeForFetch = toExchangeType(newType);
    fetchSymbols(exchangeTypeForFetch);
    
    // 外部コールバックがあれば呼び出す
    if (onExchangeTypeChange) {
      onExchangeTypeChange(newType);
    }
  };
  
  // 初回レンダリング時に銘柄を取得
  useEffect(() => {
    const exchangeTypeForFetch = toExchangeType(exchangeType);
    fetchSymbols(exchangeTypeForFetch);
  }, [fetchSymbols, exchangeType, toExchangeType]);
  
  // データフェッチを再試行する関数
  const retryFetch = () => {
    const exchangeTypeForFetch = toExchangeType(exchangeType);
    fetchSymbols(exchangeTypeForFetch);
  };
  
  return {
    // ストアから取得したデータ
    symbols: {
      filteredSymbols,
      isLoading,
      error
    },
    
    // アクション
    actions: {
      toggleFavorite,
      retryFetch
    },
    
    // 取引タイプ関連
    exchangeType: {
      current: exchangeType,
      handleChange: handleExchangeTypeChange
    }
  };
};

export default useSelectorStores; 