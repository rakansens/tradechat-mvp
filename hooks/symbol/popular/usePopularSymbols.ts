/**
 * hooks/symbol/popular/usePopularSymbols.ts
 * 人気銘柄リストを管理するフック
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 更新: リファクタリングによりhooks/symbol/popular/に移動
 * - 更新: 型定義インポートをrootStoreに対応
 */

import { useMemo } from 'react';
import type { SymbolInfo, FilterOptions } from '@/types/symbol';

/**
 * 人気銘柄のリスト
 * - USDTペアで主要な暗号資産
 */
export const POPULAR_SYMBOLS = [
  'BTCUSDT',   // ビットコイン
  'ETHUSDT',   // イーサリアム
  'SOLUSDT',   // ソラナ 
  'XRPUSDT',   // リップル
  'DOGEUSDT',  // ドージコイン
  'AVAXUSDT',  // アバランチ
  'MATICUSDT', // ポリゴン
  'ADAUSDT'    // カルダノ
];

interface UsePopularSymbolsProps {
  symbols: SymbolInfo[];
  filterOptions: FilterOptions;
}

/**
 * 人気銘柄のリストを管理するフック
 * 
 * フィルターが適用されていない場合のみ、人気銘柄のリストを返します。
 * 
 * @param symbols 全銘柄リスト
 * @param filterOptions 現在のフィルターオプション
 * @returns フィルター条件に応じた人気銘柄リスト
 */
export const usePopularSymbols = ({
  symbols,
  filterOptions
}: UsePopularSymbolsProps) => {
  return useMemo(() => {
    // フィルターが適用されている場合は空配列を返す
    if (filterOptions.searchTerm || filterOptions.quoteAsset || filterOptions.favoritesOnly) {
      return [];
    }
    
    // 人気銘柄のみを抽出
    return symbols.filter(symbol => 
      POPULAR_SYMBOLS.includes(symbol.symbol)
    );
  }, [symbols, filterOptions]);
};

export default usePopularSymbols; 