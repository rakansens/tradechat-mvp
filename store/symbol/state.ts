// store/symbol/state.ts
// 作成: SymbolSliceの状態定義
// 更新: プロパティ名の衝突を避けるための修正
// 更新: 2025-10-05 - 型定義をtypes.tsに移動
// 更新: 2025-10-08 - S-2フェーズ: 型定義を@/types/store/symbolからインポート
// 更新: 2025-10-08 - S-9.2フェーズ: ExchangeType型の一貫性を確保

import { type ExchangeProductType } from '@/types/constants/enums';
import { symbolService } from '@/services/symbol';
import type { SymbolInfo, SymbolChangeHistoryEntry } from '@/types/symbol';
import type { SymbolState, SymbolFilterOptions } from '@/types/symbol/store';

/**
 * シンボルスライスの状態型定義
 * 注: 他のスライスとの名前衝突を避けるため、一部のプロパティに接頭辞を追加
 */
// 既存のSymbolSliceStateをSymbolStateに合わせて更新
export interface SymbolSliceState extends SymbolState {}

/**
 * 最後に使用したシンボルをローカルストレージから取得する関数
 * @private 内部利用のみ
 */
const getInitialSymbol = (): string => {
  return symbolService.getLastUsedSymbol();
};

/**
 * 最後に使用した取引種別をローカルストレージから取得して適切な型に変換する関数
 * @private 内部利用のみ
 */
const getInitialExchangeType = (): ExchangeProductType => {
  // 文字列を取得して返す（safeExchangeType は使用しない）
  return symbolService.getLastUsedExchangeType();
};

/**
 * シンボルスライスの初期状態
 */
export const initialSymbolState: Partial<SymbolState> = {
  currentSymbol: getInitialSymbol(),
  exchangeType: getInitialExchangeType(),
  symbolsList: [],
  filteredSymbols: [],
  filterOptions: {
    search: '',
    quoteAsset: 'USDT',
    showFavoritesOnly: false,
    hideStablePairs: false,
  },
  isLoading: false,
  error: null,
  changeHistory: []
}; 