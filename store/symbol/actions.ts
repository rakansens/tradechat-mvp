// store/symbol/actions.ts
// 作成: SymbolSliceのアクション定義
// 更新: 型定義の問題を修正
// 更新: プロパティ名の衝突回避による変更を反映
// 更新: T-7.7.1フェーズ - SymbolChangeHistory型の使用を修正
// 更新: T-7.7.5フェーズ - パラメータの型定義を修正

import { logger } from '@/utils/common';
import type { StoreApi } from 'zustand';
import type { ExchangeType } from '@/types/network/api';
import { symbolService, type FilterOptions, type SymbolInfo, type SymbolChangeHistory } from '@/services/symbol';
import type { SymbolSliceState } from './state';
import { produce } from 'immer';

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

/**
 * シンボルスライスのアクションを作成する関数
 */
export const createSymbolActions = (
  set: (partial: ((draft: SymbolSliceState) => void) | Partial<SymbolSliceState>) => void,
  get: () => SymbolSliceState,
): SymbolActions => {
  // u3044u3063u305fu3093u30a2u30afu30b7u30e7u30f3u30aau30d6u30b8u30a7u30afu30c8u3092u5b9au7fa9u3057u3066u76f8u4e92u53c2u7167u53efu80fdu306bu3059u308b
  const actions: SymbolActions = {
    // u73feu5728u306eu30b7u30f3u30dcu30ebu3092u8a2du5b9a
    setCurrentSymbol: (symbol: string, reason?: string) => {
      // u30b7u30f3u30dcu30ebu6b63u898fu5316
      const normalizedSymbol = symbolService.normalizeSymbol(symbol);
      
      // u73feu5728u306eu30b7u30f3u30dcu30ebu3092u6b63u898fu5316u3057u3066u6bd4u8f03
      const currentSymbol = get().currentSymbol;
      const normalizedCurrentSymbol = symbolService.normalizeSymbol(currentSymbol);
      
      // u30b7u30f3u30dcu30ebu5909u66f4u306eu30edu30b0u3092u5f37u5316
      logger.info(`setCurrentSymbol called with symbol: ${symbol} (normalized: ${normalizedSymbol})`, {
        component: 'SymbolSlice',
        action: 'setCurrentSymbol',
        currentSymbol,
        normalizedCurrentSymbol,
        reason: reason || 'u30e6u30fcu30b6u30fcu30a2u30afu30b7u30e7u30f3',
        timestamp: Date.now()
      });
      
      // u30b7u30f3u30dcu30ebu5909u66f4u5c65u6b74u306bu8ffdu52a0
      set((state: SymbolSliceState) => {
        state.symbolChangeHistory = [
          ...state.symbolChangeHistory,
          {
            from: currentSymbol,
            to: symbol,
            timestamp: Date.now(),
            reason: reason || 'u30e6u30fcu30b6u30fcu30a2u30afu30b7u30e7u30f3'
          }
        ].slice(-20); // u6700u696d20u4ef6u306eu307fu4fddu6301
      });
      
      // u6b63u898fu5316u3057u305fu30b7u30f3u30dcu30ebu304cu540cu3058u5834u5408u306fu4f55u3082u3057u306au3044
      if (normalizedSymbol === normalizedCurrentSymbol) {
        logger.info(`Symbol already set to ${normalizedSymbol}, skipping update`, {
          component: 'SymbolSlice',
          action: 'setCurrentSymbol'
        });
        return;
      }
      
      // u30edu30b0u51fau529b
      logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
        component: 'SymbolSlice',
        action: 'setCurrentSymbol'
      });
      
      // u6700u5f8cu306bu4f7fu7528u3057u305fu30b7u30f3u30dcu30ebu3092u30edu30fcu30abu30ebu30b9u30c8u30ecu30fcu30b8u306bu4fddu5b58
      symbolService.saveLastUsedSymbol(symbol);
      
      set((state: SymbolSliceState) => {
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
      
      set((state: SymbolSliceState) => {
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
        set((state: SymbolSliceState) => {
          state.isLoadingSymbols = true;
          state.symbolError = null;
        });
        
        // シンボルサービスからデータを取得
        const symbols = await symbolService.fetchSymbols(exchangeType);
        
        logger.info(`Fetched ${symbols.length} symbols`, {
          component: 'SymbolSlice',
          action: 'fetchSymbols'
        });
        
        set((state: SymbolSliceState) => {
          state.symbolsList = symbols;
          state.filteredSymbols = symbols;
          state.isLoadingSymbols = false;
        });
        
        // u30d5u30a3u30ebu30bfu30fcu3092u9069u7528
        const { symbolFilterOptions } = get();
        actions.applyFilters(symbolFilterOptions);
        
      } catch (error) {
        logger.error(`Failed to fetch symbols: ${error}`, {
          component: 'SymbolSlice',
          action: 'fetchSymbols',
          error
        });
        
        set((state: SymbolSliceState) => {
          state.isLoadingSymbols = false;
          state.symbolError = error instanceof Error ? error.message : 'シンボルの取得に失敗しました';
        });
      }
    },
    
    // フィルターオプションを設定
    setFilterOptions: (options: Partial<FilterOptions>) => {
      const currentOptions = get().symbolFilterOptions;
      const newOptions = { ...currentOptions, ...options };
      
      set((state: SymbolSliceState) => {
        state.symbolFilterOptions = newOptions;
      });
      actions.applyFilters(newOptions);
    },
    
    // u30d5u30a3u30ebu30bau30fcu3092u9069u7528uff08u5185u90e8u30e1u30bdu30c3u30c9uff09
    applyFilters: (options: FilterOptions) => {
      const { symbolsList } = get();
      
      // u30b7u30f3u30dcu30ebu30b5u30fcu30d3u30b9u306eu30d5u30a3u30ebu30bau30fcu6a5fu80fdu3092u4f7fu7528
      const filtered = symbolService.filterSymbols(symbolsList, options);
      
      set((state: SymbolSliceState) => {
        state.filteredSymbols = filtered;
      });
    },
    
    // u304au6c17u306bu5165u308au3092u5207u66ffu3048
    toggleFavorite: (symbol: string) => {
      // u5bfeu8c61u306eu9298u67c4u3092u898bu3064u3051u308b
      const { symbolsList } = get();
      
      // u5bfeu8c61u306eu9298u67c4u3092u898bu3064u3051u308b
      const targetSymbol = symbolsList.find(s => s.symbol === symbol);
      
      if (targetSymbol) {
        // u304au6c17u306bu5165u308au306eu72b6u614bu3092u5207u66ffu3048u308b
        set((state: SymbolSliceState) => {
          // u304au6c17u306bu5165u308au306eu72b6u614bu3092u5207u66ffu3048u308b
          const updatedSymbols = symbolsList.map(s => 
            s.symbol === symbol ? { ...s, favorite: !targetSymbol.favorite } : s
          );
          
          // u304au6c17u306bu5165u308au306eu72b6u614bu3092u5207u66ffu3048u308b
          state.symbolsList = updatedSymbols;
          
          // u5909u66f4u5c65u6b74u306bu8ffdu52a0
          state.symbolChangeHistory = [
            ...state.symbolChangeHistory,
            {
              from: symbol,
              to: symbol,
              timestamp: Date.now(),
              reason: `u304au6c17u306bu5165u308au72b6u614bu3092${!targetSymbol.favorite ? 'u8ffdu52a0' : 'u89e3u9664'}u306bu5909u66f4`
            }
          ];
        });
        
        // u30edu30b0u51fau529b
        logger.info(`Symbol favorite toggled: ${symbol}`, {
          component: 'SymbolSlice',
          action: 'toggleFavorite',
          newState: !targetSymbol.favorite
        });
        
        // u30d5u30a3u30ebu30bau30fcu3092u518du9069u7528
        const { symbolFilterOptions } = get();
        actions.applyFilters(symbolFilterOptions);
      }
    },
    
    // u30d5u30a3u30ebu30bau30fcu3092u30afu30eau30a2
    clearFilters: () => {
      const clearOptions = {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false
      };
      
      set((state: SymbolSliceState) => {
        state.symbolFilterOptions = clearOptions;
      });
      actions.applyFilters(clearOptions);
    },
    
    // u30b7u30f3u30dcu30ebu5909u66f4u5c65u6b74u3092u53d6u5f97
    getSymbolChangeHistory: () => {
      return get().symbolChangeHistory;
    }
  };
  
  return actions;
}; 