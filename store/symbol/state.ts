// store/symbol/state.ts
// 作成: SymbolSliceの状態定義
// 更新: プロパティ名の衝突を避けるための修正
// 更新: 2025-10-05 - 型定義をtypes.tsに移動

import { ExchangeType } from '@/types/network/api';
import { symbolService, type SymbolInfo, type FilterOptions, type SymbolChangeHistory } from '@/services/symbol';

/**
 * シンボルスライスの状態型定義
 * 注: 他のスライスとの名前衝突を避けるため、一部のプロパティに接頭辞を追加
 */
export interface SymbolSliceState {
  // シンボル関連の状態
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbolsList: SymbolInfo[]; // 名前衝突回避のため変更
  filteredSymbols: SymbolInfo[];
  symbolFilterOptions: FilterOptions; // 名前衝突回避のため変更
  isLoadingSymbols: boolean;
  symbolError: string | null;
  symbolChangeHistory: SymbolChangeHistory[];
}

/**
 * 最後に使用したシンボルをローカルストレージから取得する関数
 */
const getInitialSymbol = (): string => {
  return symbolService.getLastUsedSymbol();
};

/**
 * 最後に使用した取引種別をローカルストレージから取得する関数
 */
const getInitialExchangeType = (): ExchangeType => {
  return symbolService.getLastUsedExchangeType();
};

/**
 * シンボルスライスの初期状態
 */
export const initialSymbolState = {
  currentSymbol: getInitialSymbol(),
  exchangeType: getInitialExchangeType(),
  symbolsList: [] as SymbolInfo[],
  filteredSymbols: [] as SymbolInfo[],
  symbolFilterOptions: {
    searchTerm: '',
    quoteAsset: '',
    favoritesOnly: false
  } as FilterOptions,
  isLoadingSymbols: false,
  symbolError: null as string | null,
  symbolChangeHistory: [] as SymbolChangeHistory[]
}; 