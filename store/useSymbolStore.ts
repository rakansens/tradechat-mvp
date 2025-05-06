// store/useSymbolStore.ts
// 作成: 銘柄リスト管理用のZustandストア

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getApiClient } from '@/services/apiClientFactory';
import { ExchangeType } from '@/types/api';
import { SymbolInfo, SymbolFilterOptions } from '@/types/symbol';
import { logger } from '@/utils/logger';

// ストアの状態の型定義
interface SymbolState {
  // データ
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  favoriteSymbols: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // フィルター設定
  filterOptions: SymbolFilterOptions;
  
  // アクション
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<SymbolFilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
}

// デフォルトのフィルター設定
const defaultFilterOptions: SymbolFilterOptions = {
  searchTerm: '',
  quoteAsset: '',
  favoritesOnly: false
};

// フィルタリング関数
const applyFilters = (
  symbols: SymbolInfo[], 
  options: SymbolFilterOptions,
  favoriteSymbols: string[]
): SymbolInfo[] => {
  return symbols
    .map(symbol => ({
      ...symbol,
      isFavorite: favoriteSymbols.includes(symbol.symbol)
    }))
    .filter(symbol => {
      // 検索語句でフィルタリング
      const matchesSearch = options.searchTerm === '' || 
        symbol.symbol.toLowerCase().includes(options.searchTerm.toLowerCase()) ||
        symbol.baseAsset.toLowerCase().includes(options.searchTerm.toLowerCase()) ||
        symbol.quoteAsset.toLowerCase().includes(options.searchTerm.toLowerCase());
        
      // 基軸通貨でフィルタリング
      const matchesQuote = options.quoteAsset === '' || 
        symbol.quoteAsset === options.quoteAsset;
        
      // お気に入りでフィルタリング
      const matchesFavorite = !options.favoritesOnly || 
        favoriteSymbols.includes(symbol.symbol);
        
      return matchesSearch && matchesQuote && matchesFavorite;
    })
    .sort((a, b) => {
      // お気に入りを先頭に
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      
      // 次に取引量の多い主要通貨を優先（実際のデータがあればそれを使用）
      const majorCoins = ['BTC', 'ETH', 'USDT', 'BNB'];
      const aIsMajor = majorCoins.includes(a.baseAsset);
      const bIsMajor = majorCoins.includes(b.baseAsset);
      
      if (aIsMajor && !bIsMajor) return -1;
      if (!aIsMajor && bIsMajor) return 1;
      
      // 最後にアルファベット順
      return a.symbol.localeCompare(b.symbol);
    });
};

// Zustandストアの作成
export const useSymbolStore = create<SymbolState>()(
  persist(
    (set, get) => ({
      // 初期状態
      symbols: [],
      filteredSymbols: [],
      favoriteSymbols: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      filterOptions: defaultFilterOptions,
      
      // 銘柄リストを取得
      fetchSymbols: async (exchangeType: ExchangeType) => {
        // 既にデータがあり、30分以内に更新されている場合はスキップ
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        if (get().symbols.length > 0 && get().lastUpdated && get().lastUpdated > thirtyMinutesAgo) {
          logger.info('Using cached symbols data', {
            component: 'useSymbolStore',
            action: 'fetchSymbols',
            cacheAge: Math.round((Date.now() - (get().lastUpdated || 0)) / 1000) + 's'
          });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const apiClient = getApiClient(exchangeType);
          if (!apiClient) {
            throw new Error('API client not initialized');
          }
          
          logger.info('Fetching symbols', {
            component: 'useSymbolStore',
            action: 'fetchSymbols',
            exchangeType
          });
          
          const symbols = await apiClient.fetchSymbols(exchangeType);
          
          logger.info(`Fetched ${symbols.length} symbols`, {
            component: 'useSymbolStore',
            action: 'fetchSymbols',
            count: symbols.length
          });
          
          // 銘柄リストを保存し、フィルタリングを適用
          set(state => {
            const filteredSymbols = applyFilters(symbols, state.filterOptions, state.favoriteSymbols);
            return { 
              symbols,
              filteredSymbols,
              isLoading: false,
              lastUpdated: Date.now()
            };
          });
        } catch (error) {
          logger.error('Failed to fetch symbols', error, {
            component: 'useSymbolStore',
            action: 'fetchSymbols'
          });
          set({ error: 'Failed to fetch symbols', isLoading: false });
        }
      },
      
      // フィルター設定を更新
      setFilterOptions: (options: Partial<SymbolFilterOptions>) => {
        set(state => {
          const newOptions = { ...state.filterOptions, ...options };
          const filteredSymbols = applyFilters(state.symbols, newOptions, state.favoriteSymbols);
          return { filterOptions: newOptions, filteredSymbols };
        });
      },
      
      // お気に入りの切り替え
      toggleFavorite: (symbol: string) => {
        set(state => {
          let newFavorites: string[];
          
          if (state.favoriteSymbols.includes(symbol)) {
            newFavorites = state.favoriteSymbols.filter(s => s !== symbol);
          } else {
            newFavorites = [...state.favoriteSymbols, symbol];
          }
          
          // フィルタリングを再適用
          const filteredSymbols = applyFilters(state.symbols, state.filterOptions, newFavorites);
          
          return { favoriteSymbols: newFavorites, filteredSymbols };
        });
      },
      
      // フィルターをクリア
      clearFilters: () => {
        set(state => {
          const filteredSymbols = applyFilters(
            state.symbols, 
            defaultFilterOptions,
            state.favoriteSymbols
          );
          return { filterOptions: defaultFilterOptions, filteredSymbols };
        });
      }
    }),
    {
      name: 'symbol-store',
      partialize: (state) => ({ 
        favoriteSymbols: state.favoriteSymbols 
      })
    }
  )
);
