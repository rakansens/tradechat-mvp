/**
 * hooks/symbol/selector/useAdvancedPopularSymbols.ts
 * 高度な人気銘柄選定ロジックを提供するフック
 */

import { useMemo } from 'react';
import type { SymbolInfo } from '@/types/common/symbol';
import type { FilterOptions } from '@/services/symbol';

interface UseAdvancedPopularSymbolsProps {
  symbols: SymbolInfo[];
  filterOptions: FilterOptions;
}

/**
 * 人気銘柄を取得するフック
 */
export const useAdvancedPopularSymbols = ({
  symbols,
  filterOptions
}: UseAdvancedPopularSymbolsProps) => {
  const popularSymbols = useMemo(() => {
    const favorites = symbols.filter(s => s.favorite);

    // お気に入りのみ表示中は重複を避けるため空配列を返す
    if (filterOptions.favoritesOnly) {
      return [];
    }

    if (favorites.length <= 3) {
      const mainSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
      const popularByName = symbols.filter(s =>
        !s.favorite &&
        mainSymbols.some(name =>
          s.baseCoin === name && (!filterOptions.quoteCoin || s.quoteCoin === filterOptions.quoteCoin)
        )
      );
      return [...favorites, ...popularByName].slice(0, 6);
    }

    return favorites.slice(0, 6);
  }, [symbols, filterOptions]);

  return popularSymbols;
};

export default useAdvancedPopularSymbols;
