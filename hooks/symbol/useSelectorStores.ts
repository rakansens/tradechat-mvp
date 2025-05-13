/**
 * hooks/symbol/useSelectorStores.ts
 * シンボルセレクタで使用するストアのデータとアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 更新: 古いuseSymbolStoreを新しいrootStoreのSymbolSliceに置き換え
 */

// 古いインポートを削除
// import { useSymbolStore } from '@/store/useSymbolStore';
import { useState, useEffect } from 'react';
import type { ExchangeType } from '@/types/api';
import { useRootStore } from '@/store/rootStore';
import { 
  selectFilteredSymbols, 
  selectIsLoadingSymbols, 
  selectSymbolError 
} from '@/store/barrel';

interface UseSelectorStoresProps {
  defaultExchangeType?: ExchangeType;
  onExchangeTypeChange?: (type: ExchangeType) => void;
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
  const [exchangeType, setExchangeType] = useState<ExchangeType>(defaultExchangeType);
  
  // 取引タイプ変更のハンドラー
  const handleExchangeTypeChange = (value: string) => {
    const newType = value as ExchangeType;
    setExchangeType(newType);
    fetchSymbols(newType);
    
    // 外部コールバックがあれば呼び出す
    if (onExchangeTypeChange) {
      onExchangeTypeChange(newType);
    }
  };
  
  // 初回レンダリング時に銘柄を取得
  useEffect(() => {
    fetchSymbols(exchangeType);
  }, [fetchSymbols, exchangeType]);
  
  // データフェッチを再試行する関数
  const retryFetch = () => {
    fetchSymbols(exchangeType);
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