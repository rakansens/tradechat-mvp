// store/symbol/actions.ts
// 作成: SymbolSliceのアクション定義
// 更新: 型定義の問題を修正
// 更新: プロパティ名の衝突回避による変更を反映
// 更新: T-7.7.1フェーズ - SymbolChangeHistory型の使用を修正
// 更新: T-7.7.5フェーズ - パラメータの型定義を修正
// 更新: 2025-10-05 - 型定義をtypes.tsに移動し、そこから参照するように変更

import { logger } from '@/utils/common';
import type { ExchangeType } from '@/types/network/api';
import { symbolService, type FilterOptions, type SymbolInfo } from '@/services/symbol';
import type { SymbolSliceState, SymbolSliceActions } from './types';
import { produce } from 'immer';

/**
 * シンボルスライスのアクションを作成する関数
 */
export const createSymbolActions = (
  set: (partial: ((draft: SymbolSliceState) => void) | Partial<SymbolSliceState>) => void,
  get: () => SymbolSliceState,
): SymbolSliceActions => {
  // アクションオブジェクトを定義して相互参照可能にする
  const actions: SymbolSliceActions = {
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
      set((state: SymbolSliceState) => {
        state.symbolChangeHistory = [
          ...state.symbolChangeHistory,
          {
            from: currentSymbol,
            to: symbol,
            timestamp: Date.now(),
            reason: reason || 'ユーザーアクション'
          }
        ].slice(-20); // 最大20件のみ保持
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
        
        // フィルターを適用
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
    
    // フィルーを適用（内部メソッド）
    applyFilters: (options: FilterOptions) => {
      const { symbolsList } = get();
      
      // シンボルサービスのフィルー機能を使用
      const filtered = symbolService.filterSymbols(symbolsList, options);
      
      set((state: SymbolSliceState) => {
        state.filteredSymbols = filtered;
      });
    },
    
    // お気に入りを切り替え
    toggleFavorite: (symbol: string) => {
      // 対象の銘柄を見つける
      const { symbolsList } = get();
      
      // 対象の銘柄を見つける
      const targetSymbol = symbolsList.find(s => s.symbol === symbol);
      
      if (targetSymbol) {
        // お気に入りの状態を切り替える
        set((state: SymbolSliceState) => {
          // お気に入りの状態を切り替える
          const updatedSymbols = symbolsList.map(s => 
            s.symbol === symbol ? { ...s, favorite: !targetSymbol.favorite } : s
          );
          
          // お気に入りの状態を切り替える
          state.symbolsList = updatedSymbols;
          
          // 変更履歴に追加
          state.symbolChangeHistory = [
            ...state.symbolChangeHistory,
            {
              from: symbol,
              to: symbol,
              timestamp: Date.now(),
              reason: `お気に入り状態を${!targetSymbol.favorite ? '追加' : '解除'}に変更`
            }
          ];
        });
        
        // ログ出力
        logger.info(`Symbol favorite toggled: ${symbol}`, {
          component: 'SymbolSlice',
          action: 'toggleFavorite',
          newState: !targetSymbol.favorite
        });
        
        // フィルーを再適用
        const { symbolFilterOptions } = get();
        actions.applyFilters(symbolFilterOptions);
      }
    },
    
    // フィルーをクリア
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
    
    // シンボル変更履歴を取得
    getSymbolChangeHistory: () => {
      return get().symbolChangeHistory;
    }
  };
  
  return actions;
}; 