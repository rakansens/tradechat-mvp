// store/symbol/actions.ts
// 作成: 2025-10-05 - SymbolSliceのアクションを定義
// 更新: 2025-10-08 - S-3フェーズ: 旧型参照を@/types/store/symbolからの参照に更新
// 更新: 2025-10-08 - S-9.2フェーズ: ExchangeType型の参照を統一し型エラーを解消
// 更新: 2025-10-09 - S-9.2フェーズ: createIdGenerator関数のエラーを修正

import { produce } from 'immer';
import { logger } from '@/utils/logger';
import { type ExchangeType, type ProductType } from '@/types/exchange';
import { toExchangeProductType, isValidExchangeType, isValidProductType } from '@/utils/exchange';
import { symbolService } from '@/services/symbol';
import type { SymbolInfo } from '@/types/symbol';
import { 
  type SymbolState, 
  type SymbolFilterOptions,
  type SymbolActions 
} from '@/types/symbol/store';
import type { 
  SymbolChangeHistoryEntry,
  SymbolChangeValue 
} from '@/types/symbol/common';

/**
 * シンボルリストにフィルターを適用する内部ヘルパー関数
 * @param symbols シンボルリスト
 * @param options フィルターオプション
 * @returns フィルター適用後のシンボルリスト
 */
const applyFilters = (symbols: SymbolInfo[], options: SymbolFilterOptions): SymbolInfo[] => {
  if (!symbols || !Array.isArray(symbols)) {
    return [];
  }
  
  // レガシーなプロパティ名との互換性を確保
  const searchTerm = options.search || options.searchTerm || '';
  const quoteAsset = options.quoteAsset || options.quoteCoin || '';
  const showFavoritesOnly = options.showFavoritesOnly || options.favoritesOnly || false;
  const hideStable = options.hideStablePairs || (options.stable === false);
  
  return symbols.filter(symbol => {
    // 検索クエリに一致するか
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const symbolMatches = symbol.symbol.toLowerCase().includes(searchLower) ||
                         symbol.baseCoin.toLowerCase().includes(searchLower) ||
                         symbol.quoteCoin.toLowerCase().includes(searchLower);
      if (!symbolMatches) return false;
    }

    // クォートアセットでフィルタリング
    if (quoteAsset && symbol.quoteCoin !== quoteAsset) {
      return false;
    }

    // お気に入りのみ表示
    if (showFavoritesOnly && !symbol.favorite) {
      return false;
    }

    // 安定コインペアを非表示
    if (hideStable && isStablePair(symbol.symbol)) {
      return false;
    }

    return true;
  });
};

// 安定コインペアかどうかを判定
const isStablePair = (symbol: string): boolean => {
  const stableCoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD', 'USDP', 'GUSD'];
  return stableCoins.some(coin => symbol.endsWith(coin));
};

// レガシーサポートのための型エイリアス
type FilterOptions = SymbolFilterOptions;

// ID生成用ヘルパー関数
const createIdGenerator = (prefix: string) => {
  let counter = 0;
  return () => `${prefix}-${Date.now()}-${counter++}`;
};

// シンボル変更履歴エントリーID生成関数
const generateChangeId = createIdGenerator('symbol-change');

/**
 * SymbolSliceアクション作成関数
 * @param mutateDraft immer状態更新関数
 * @param getState 状態取得関数
 * @returns SymbolActions
 */
export const createSymbolActions = (
  mutateDraft: (fn: (draft: SymbolState) => void) => void,
  getState: () => SymbolState
): SymbolActions => ({
  // 現在選択中のシンボルを設定
  setCurrentSymbol: (symbol: string, reason?: string) => {
    mutateDraft((draft) => {
      // シンボル変更イベントを記録
      const oldSymbol = draft.currentSymbol;
      if (oldSymbol !== symbol) {
        draft.changeHistory.push({
          id: generateChangeId(),
          timestamp: Date.now(),
          symbol,
          exchangeType: draft.exchangeType,
          field: 'currentSymbol',
          oldValue: oldSymbol,
          newValue: symbol,
          source: reason || 'user',
        });

        // ローカルストレージに保存
        symbolService.saveLastUsedSymbol(symbol);
      }

      draft.currentSymbol = symbol;
    });

    logger.info(`[SymbolSlice] Changed current symbol to: ${symbol}`);
  },

  // 取引タイプを設定
  setExchangeType: (type: ExchangeType | ProductType) => {
    const oldType = getState().exchangeType;
    
    // 型を安全に変換
    let productType: ProductType;
    
    mutateDraft((draft) => {
      // ProductType が渡された場合はそのまま使用
      if (isValidProductType(type)) {
        productType = type;
      } 
      // ExchangeType が渡された場合はデフォルトの取引タイプに変換
      else if (isValidExchangeType(type)) {
        productType = toExchangeProductType(type);
        logger.info(`[SymbolSlice] Converted exchange type '${type}' to product type '${productType}'`);
      } 
      // 無効な値の場合はデフォルト値を使用
      else {
        productType = 'spot';
        logger.warn(`[SymbolSlice] Invalid exchange type '${type}', using default '${productType}'`);
      }
      
      if (oldType !== productType) {
        // 変更履歴を記録
        draft.changeHistory.push({
          id: generateChangeId(),
          timestamp: Date.now(),
          symbol: draft.currentSymbol,
          exchangeType: productType,
          field: 'exchangeType',
          oldValue: oldType,
          newValue: productType,
          source: 'user',
        });
        
        // ローカルストレージに保存
        symbolService.saveLastUsedExchangeType(productType);
        
        // 状態を更新
        draft.exchangeType = productType;
        logger.info(`[SymbolSlice] Changed exchange type to: ${productType}`);
      }
    });
  },

  // シンボル一覧を取得
  fetchSymbols: async (exchangeType: ExchangeProductType = 'spot') => {
    mutateDraft((draft) => {
      draft.isLoading = true;
      draft.error = null;
    });
    
    try {
      // 安全な型変換を適用
      let safeType: ExchangeProductType;
      
      if (isValidExchangeProductType(exchangeType)) {
        safeType = exchangeType;
      } else if (isValidExchangeType(exchangeType)) {
        safeType = toExchangeProductType(exchangeType);
      } else {
        safeType = 'spot';
        logger.warn(`[SymbolSlice] Invalid exchange type '${exchangeType}', using default 'spot'`);
      }
      
      const symbols = await symbolService.fetchSymbols(safeType);
      
      mutateDraft((draft) => {
        draft.symbolsList = symbols;
        draft.filteredSymbols = applyFilters(symbols, draft.filterOptions);
        draft.isLoading = false;
      });
      
      logger.info(`[SymbolSlice] Fetched ${symbols.length} symbols for ${safeType}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch symbols';
      
      mutateDraft((draft) => {
        draft.error = errorMessage;
        draft.isLoading = false;
      });
      
      logger.error(`[SymbolSlice] Error fetching symbols: ${errorMessage}`, { error });
      throw error;
    }
  },

  // フィルターオプションを設定
  setFilterOptions: (options: Partial<SymbolFilterOptions>) => {
    mutateDraft((draft) => {
      // フィルターオプションをマージ
      const newFilterOptions = {
        ...draft.filterOptions,
        ...options,
      };
      
      draft.filterOptions = newFilterOptions;
      
      // フィルターを適用
      draft.filteredSymbols = applyFilters(draft.symbolsList, newFilterOptions);
    });
    
    logger.info('[SymbolSlice] Set filter options', { options });
  },
  
  // フィルターを適用
  applyFilters: (options: SymbolFilterOptions) => {
    mutateDraft((draft) => {
      const newFilterOptions = {
        ...draft.filterOptions,
        ...options,
      };
      
      draft.filterOptions = newFilterOptions;
      draft.filteredSymbols = applyFilters(draft.symbolsList, newFilterOptions);
    });
    
    logger.info('[SymbolSlice] Applied filters', { options });
  },

  // 変更履歴を追加
  addToHistory: (entry: Omit<SymbolChangeHistoryEntry, 'id' | 'timestamp'>) => {
    mutateDraft((draft) => {
      draft.changeHistory.push({
        ...entry,
        id: generateChangeId(),
        timestamp: Date.now(),
      });

      // 履歴の最大数を制限（例: 最新100件を保持）
      const MAX_HISTORY = 100;
      if (draft.changeHistory.length > MAX_HISTORY) {
        draft.changeHistory = draft.changeHistory.slice(-MAX_HISTORY);
      }
    });
  },

  // 変更履歴をクリア
  clearHistory: () => {
    mutateDraft((draft) => {
      draft.changeHistory = [];
    });
  },

  // シンボル一覧を設定
  setSymbols: (symbols: SymbolInfo[]) => {
    mutateDraft((draft) => {
      draft.symbolsList = symbols;
      draft.filteredSymbols = applyFilters(symbols, draft.filterOptions);
    });
  },

  // シンボルを追加
  addSymbol: (symbol: SymbolInfo) => {
    mutateDraft((draft) => {
      const exists = draft.symbolsList.some(s => s.id === symbol.id);
      if (!exists) {
        draft.symbolsList.push(symbol);
        draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
      }
    });
  },

  // シンボルを削除
  removeSymbol: (symbolId: string) => {
    mutateDraft((draft) => {
      draft.symbolsList = draft.symbolsList.filter(s => s.id !== symbolId);
      draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
    });
  },

  // シンボルを保存（追加または更新）
  saveSymbol: async (symbol: SymbolInfo): Promise<void> => {
    return new Promise((resolve) => {
      mutateDraft((draft) => {
        const index = draft.symbolsList.findIndex(s => s.id === symbol.id);
        if (index >= 0) {
          // 既存のシンボルを更新
          draft.symbolsList[index] = symbol;
        } else {
          // 新しいシンボルを追加
          draft.symbolsList.push(symbol);
        }
        draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
      });
      resolve();
    });
  },

  // シンボルを削除（非同期版）
  deleteSymbol: async (symbolId: string): Promise<void> => {
    return new Promise((resolve) => {
      mutateDraft((draft) => {
        draft.symbolsList = draft.symbolsList.filter(s => s.id !== symbolId);
        draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
      });
      resolve();
    });
  },

  // シンボル情報を更新
  updateSymbol: (update: Partial<SymbolInfo> & { id: string }) => {
    mutateDraft((draft) => {
      const symbolIndex = draft.symbolsList.findIndex(s => s.id === update.id);
      if (symbolIndex !== -1) {
        const oldSymbol = draft.symbolsList[symbolIndex];
        const updatedSymbol = {
          ...oldSymbol,
          ...update,
        };
        
        draft.symbolsList[symbolIndex] = updatedSymbol;
        
        // フィルターを再適用
        draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
        
        // 変更履歴に追加（お気に入り変更の場合）
        if ('favorite' in update) {
          const historyEntry: SymbolChangeHistoryEntry = {
            id: generateChangeId(),
            timestamp: Date.now(),
            symbol: updatedSymbol.symbol,
            exchangeType: draft.exchangeType,
            field: 'favorite',
            oldValue: String(!update.favorite),
            newValue: String(update.favorite),
            source: 'user',
          };
          draft.changeHistory.push(historyEntry);
        }
      }
    });
  },
  
  // お気に入りをトグル
  toggleFavorite: (symbolId: string) => {
    mutateDraft((draft) => {
      const symbolIndex = draft.symbolsList.findIndex(s => s.id === symbolId);
      if (symbolIndex !== -1) {
        const symbol = draft.symbolsList[symbolIndex];
        const newFavoriteStatus = !symbol.favorite;
        
        // シンボルを更新
        draft.symbolsList[symbolIndex] = {
          ...symbol,
          favorite: newFavoriteStatus
        };
        
        // フィルターを再適用
        draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
        
        // 変更履歴に追加
        const historyEntry: SymbolChangeHistoryEntry = {
          id: generateChangeId(),
          timestamp: Date.now(),
          symbol: symbol.symbol,
          exchangeType: draft.exchangeType,
          field: 'favorite',
          oldValue: String(!newFavoriteStatus),
          newValue: String(newFavoriteStatus),
          source: 'user',
        };
        
        draft.changeHistory.push(historyEntry);
        
        logger.info(`[SymbolSlice] Toggled favorite for symbol ${symbol.symbol} to ${newFavoriteStatus}`);
      }
    });
  },
  
  // フィルターをリセット
  resetFilters: () => {
    mutateDraft((draft) => {
      // フィルターオプションをリセット
      draft.filterOptions = {
        search: '',
        quoteAsset: '',
        showFavoritesOnly: false,
        hideStablePairs: false,
        // レガシーなプロパティとの互換性のため
        searchTerm: '',
        quoteCoin: '',
        favoritesOnly: false,
        stable: true
      };
      
      // フィルターを再適用
      draft.filteredSymbols = applyFilters(draft.symbolsList, draft.filterOptions);
      
      // ログに記録
      logger.info('Symbol filters reset');
    });
  },
  
  // フィルターをクリア（resetFilters のエイリアス）
  clearFilters: function() {
    this.resetFilters();
  },
  
  // シンボル変更履歴を取得
  getSymbolChangeHistory: function() {
    return getState().changeHistory;
  }
});

// デフォルトエクスポートとして関数をエクスポート
export default createSymbolActions;
