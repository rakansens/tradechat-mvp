// store/symbol/actions.ts
// 作成: SymbolSliceのアクション定義
// 更新: 型定義の問題を修正
// 更新: プロパティ名の衝突回避による変更を反映

import { logger } from '@/utils/common';
import type { StoreApi } from 'zustand';
import type { ExchangeType } from '@/types/network/api';
import { symbolService, type FilterOptions, type SymbolInfo } from '@/services/symbol';
import type { SymbolSliceState } from './state';

/**
 * シンボルスライスのアクション型定義
 */
export interface SymbolActions {
  // シンボル関連のアクション
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  applyFilters: (options: FilterOptions) => void;
  
  // デバッグ関連のアクション
  getSymbolChangeHistory: () => SymbolSliceState['symbolChangeHistory'];
}

/**
 * シンボルスライスの型定義
 */
export type SymbolSlice = SymbolSliceState & SymbolActions;

// TypeScriptの型循環参照エラーを回避するための型アサーション
type StateCreator<T> = (
  set: (partial: ((draft: T) => void) | Partial<T>) => void,
  get: () => T
) => T;

/**
 * シンボルスライスのアクションを作成する関数
 */
export const createSymbolActions = <T extends SymbolSlice>(
  set: any, // Zustandのset関数の型を適切に扱うためany型を使用
  get: () => T
): SymbolActions => ({
  // 現在のシンボルを設定
  setCurrentSymbol: (symbol: string, reason?: string) => {
    // シンボル正規化
    const normalizedSymbol = symbolService.normalizeSymbol(symbol);
    
    // 現在のシンボルを正規化して比較
    const currentSymbol = get().currentSymbol;
    const normalizedCurrentSymbol = symbolService.normalizeSymbol(currentSymbol);
    
    // シンボル変更のログを強化
    logger.info(`setCurrentSymbol called with symbol: ${symbol} (normalized: ${normalizedSymbol})`, {
      component: 'SymbolSlice',
      action: 'setCurrentSymbol',
      currentSymbol,
      normalizedCurrentSymbol,
      reason: reason || 'ユーザーアクション',
      timestamp: Date.now()
    });
    
    // シンボル変更履歴に追加
    set((state: T) => {
      state.symbolChangeHistory = [
        ...state.symbolChangeHistory,
        {
          from: currentSymbol,
          to: symbol,
          timestamp: Date.now(),
          reason: reason || 'ユーザーアクション'
        }
      ].slice(-20); // 最新20件のみ保持
    });
    
    // 正規化したシンボルが同じ場合は何もしない
    if (normalizedSymbol === normalizedCurrentSymbol) {
      logger.info(`Symbol already set to ${normalizedSymbol}, skipping update`, {
        component: 'SymbolSlice',
        action: 'setCurrentSymbol'
      });
      return;
    }
    
    // ログ出力
    logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
      component: 'SymbolSlice',
      action: 'setCurrentSymbol'
    });
    
    // 最後に使用したシンボルをローカルストレージに保存
    symbolService.saveLastUsedSymbol(symbol);
    
    set((state: T) => {
      state.currentSymbol = symbol;
    });
  },
  
  // 取引種別を設定
  setExchangeType: (type: ExchangeType) => {
    // 現在の取引種別と同じ場合は何もしない
    if (get().exchangeType === type) {
      logger.info(`取引種別が既に${type}に設定されているため、更新をスキップします`, {
        component: 'SymbolSlice',
        action: 'setExchangeType',
        timestamp: Date.now()
      });
      return;
    }
    
    const currentType = get().exchangeType;
    const fromFuturesToSpot = currentType === 'futures' && type === 'spot';
    
    logger.info(`取引種別を${currentType}から${type}に変更します`, {
      component: 'SymbolSlice',
      action: 'setExchangeType',
      timestamp: Date.now(),
      fromFuturesToSpot: fromFuturesToSpot ? '先物→現物の切り替え検出' : '他の切り替えパターン'
    });
    
    // 最後に使用した取引種別をローカルストレージに保存
    symbolService.saveLastUsedExchangeType(type);
    
    // 現在の銘柄を保持
    const currentSymbol = get().currentSymbol;
    
    set((state: T) => {
      state.exchangeType = type;
      // 現在の銘柄を明示的に保持
      state.currentSymbol = currentSymbol;
    });
    
    logger.info(`取引種別変更時に銘柄を保持: ${currentSymbol}`, {
      component: 'SymbolSlice',
      action: 'setExchangeType',
      type,
      currentSymbol
    });
  },
  
  // シンボル一覧を取得
  fetchSymbols: async (exchangeType: ExchangeType) => {
    try {
      set((state: T) => {
        state.isLoadingSymbols = true;
        state.symbolError = null;
      });
      
      // シンボルサービスからデータを取得
      const symbols = await symbolService.fetchSymbols(exchangeType);
      
      logger.info(`Fetched ${symbols.length} symbols`, {
        component: 'SymbolSlice',
        action: 'fetchSymbols'
      });
      
      set((state: T) => {
        state.symbolsList = symbols;
        state.filteredSymbols = symbols;
        state.isLoadingSymbols = false;
      });
      
      // フィルターを適用
      const { symbolFilterOptions } = get();
      get().applyFilters(symbolFilterOptions);
      
    } catch (error) {
      logger.error(`Failed to fetch symbols: ${error}`, {
        component: 'SymbolSlice',
        action: 'fetchSymbols',
        error
      });
      
      set((state: T) => {
        state.isLoadingSymbols = false;
        state.symbolError = error instanceof Error ? error.message : 'シンボルの取得に失敗しました';
      });
    }
  },
  
  // フィルターオプションを設定
  setFilterOptions: (options: Partial<FilterOptions>) => {
    const currentOptions = get().symbolFilterOptions;
    const newOptions = { ...currentOptions, ...options };
    
    set((state: T) => {
      state.symbolFilterOptions = newOptions;
    });
    get().applyFilters(newOptions);
  },
  
  // フィルターを適用（内部メソッド）
  applyFilters: (options: FilterOptions) => {
    const { symbolsList } = get();
    
    // シンボルサービスのフィルター機能を使用
    const filtered = symbolService.filterSymbols(symbolsList, options);
    
    set((state: T) => {
      state.filteredSymbols = filtered;
    });
  },
  
  // お気に入りを切り替え
  toggleFavorite: (symbol: string) => {
    const { symbolsList } = get();
    
    const updatedSymbols = symbolsList.map(s =>
      s.symbol === symbol ? { ...s, isFavorite: !s.isFavorite } : s
    );
    
    set((state: T) => {
      state.symbolsList = updatedSymbols;
    });
    
    // フィルターを再適用
    get().applyFilters(get().symbolFilterOptions);
  },
  
  // フィルターをクリア
  clearFilters: () => {
    const clearOptions = {
      searchTerm: '',
      quoteAsset: '',
      favoritesOnly: false
    };
    
    set((state: T) => {
      state.symbolFilterOptions = clearOptions;
    });
    get().applyFilters(clearOptions);
  },
  
  // シンボル変更履歴を取得
  getSymbolChangeHistory: () => {
    return get().symbolChangeHistory;
  }
}); 