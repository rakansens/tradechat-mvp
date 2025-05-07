// store/useSymbolStore.ts
// 更新: シンボル更新問題の根本的な解決
//
// このストアはシンボルと取引タイプの管理を一元化し、
// 他のストアやコンポーネントが購読できるようにします。
// シンボル変更時に通知する機能も実装しています。
//
// 変更内容:
// 1. シンボル正規化処理の強化
// 2. シンボル変更通知の信頼性向上
// 3. シンボル変更時のキャッシュクリア処理の改善
// 4. デバッグログの追加

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';
import { dataFetchService } from '../services/dataFetchService';
import { BitgetApiClient } from '../services/bitgetApi';
// 循環参照を解消するために直接インポートを削除

// シンボル情報の型定義
export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isFavorite: boolean;
}

// フィルターオプションの型定義
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

// シンボルストアの状態型定義
export interface SymbolState {
  // 状態
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: string | null;
  
  // リクエストキャンセル用
  _abortController: AbortController | null;
  
  // 購読者リスト
  _subscribers: Array<(state: SymbolState) => void>;
  
  // 内部ユーティリティ関数
  _normalizeSymbol: (symbol: string) => string;
  
  // アクション
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  applyFilters: (options: FilterOptions) => void;
  
  // 購読関連のアクション
  subscribe: (callback: (state: SymbolState, prevState: SymbolState) => void) => () => void;
  notifySubscribers: () => void;
}

// モックデータ（実際の実装では API から取得）
const mockSymbols: SymbolInfo[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', isFavorite: true },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', isFavorite: false },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', isFavorite: false },
];

// Zustandストア作成
export const useSymbolStore = create<SymbolState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      currentSymbol: 'BTC/USDT',
      exchangeType: 'spot',
      symbols: [],
      filteredSymbols: [],
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false
      },
      isLoading: false,
      error: null,
      
      // リクエストキャンセル用
      _abortController: null,
      
      // 購読者リスト
      _subscribers: [],
      
      // シンボル正規化関数（一貫性のある正規化処理のため）
      _normalizeSymbol: (symbol: string) => {
        return symbol.replace('/', '');
      },
      
      // 現在のシンボルを設定
      setCurrentSymbol: (symbol: string) => {
        // シンボル正規化関数を取得
        const normalizeSymbol = get()._normalizeSymbol;
        
        // シンボル形式を正規化
        const normalizedSymbol = normalizeSymbol(symbol);
        
        // 現在のシンボルを正規化して比較
        const currentSymbol = get().currentSymbol;
        const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
        
        logger.info(`setCurrentSymbol called with symbol: ${symbol} (normalized: ${normalizedSymbol})`, {
          component: 'useSymbolStore',
          action: 'setCurrentSymbol',
          currentSymbol,
          normalizedCurrentSymbol
        });
        
        // 正規化したシンボルが同じ場合は何もしない
        if (normalizedSymbol === normalizedCurrentSymbol) {
          logger.info(`Symbol already set to ${normalizedSymbol}, skipping update`, {
            component: 'useSymbolStore',
            action: 'setCurrentSymbol'
          });
          return;
        }
        
        // ログ出力
        logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
          component: 'useSymbolStore',
          action: 'setCurrentSymbol'
        });
        
        // 進行中のリクエストをキャンセル
        const state = get();
        if (state._abortController) {
          logger.info(`Aborting previous request for ${currentSymbol}`, {
            component: 'useSymbolStore',
            action: 'setCurrentSymbol'
          });
          state._abortController.abort();
        }
        
        // 新しいAbortControllerを作成
        const abortController = new AbortController();
        
        // シンボル変更前に明示的にキャッシュをクリア
        logger.info(`Clearing cache for symbol change from ${currentSymbol} to ${symbol}`, {
          component: 'useSymbolStore',
          action: 'setCurrentSymbol'
        });
        
        // 両方のシンボル形式（正規化前後）でキャッシュをクリア
        dataFetchService.handleSymbolChange(symbol);
        dataFetchService.handleSymbolChange(normalizedSymbol);
        
        // シンボルを更新
        set({
          currentSymbol: symbol,
          _abortController: abortController
        });
        
        // 購読者に通知
        get().notifySubscribers();
        
        // シンボル変更後の状態を確認（デバッグ用）
        setTimeout(async () => {
          const newState = get();
          
          try {
            // 動的インポートを使用して循環参照を解消
            const marketStoreModule = await import('./useMarketStore');
            const marketStoreSymbol = marketStoreModule.useMarketStore.getState().currentSymbol;
            
            logger.info(`Symbol change verification: symbolStore=${newState.currentSymbol}, marketStore=${marketStoreSymbol}`, {
              component: 'useSymbolStore',
              action: 'setCurrentSymbol'
            });
            
            // シンボルの不一致を検出（マーケットストアとシンボルストアの同期ずれを検出）
            if (normalizeSymbol(newState.currentSymbol) !== normalizeSymbol(marketStoreSymbol)) {
              logger.warn(`Symbol mismatch detected after change: symbolStore=${newState.currentSymbol}, marketStore=${marketStoreSymbol}`, {
                component: 'useSymbolStore',
                action: 'setCurrentSymbol'
              });
            }
          } catch (error) {
            logger.error(`Failed to verify symbol change with market store: ${error}`, {
              component: 'useSymbolStore',
              action: 'setCurrentSymbol',
              error
            });
          }
        }, 500);
      },
      
      // 取引種別を設定
      setExchangeType: (type: ExchangeType) => {
        // 現在の取引種別と同じ場合は何もしない
        if (get().exchangeType === type) {
          return;
        }
        
        logger.info(`Changing exchange type from ${get().exchangeType} to ${type}`, {
          component: 'useSymbolStore',
          action: 'setExchangeType'
        });
        
        // 取引種別を更新
        set({ exchangeType: type });
        
        // 購読者に通知
        get().notifySubscribers();
      },
      
      // 購読者を追加
      subscribe: (callback: (state: SymbolState, prevState: SymbolState) => void) => {
        // Zustandのデフォルトのsubscribeメソッドを使用
        return useSymbolStore.subscribe(callback);
      },
      
      // 購読者に通知
      notifySubscribers: () => {
        // Zustandのデフォルトの通知メカニズムを使用するため、
        // このメソッドは実際には何もする必要がありません。
        // stateが更新されると、Zustandが自動的に購読者に通知します。
        logger.info(`State updated, Zustand will notify subscribers automatically`, {
          component: 'useSymbolStore',
          action: 'notifySubscribers'
        });
      },
      
      // シンボル一覧を取得
      fetchSymbols: async (exchangeType: ExchangeType) => {
        try {
          set({ isLoading: true, error: null });
          
          // BitgetApiClientを使用して実際のAPIからデータを取得
          const api = new BitgetApiClient({}, exchangeType);
          
          logger.info(`Fetching symbols from API for ${exchangeType}`, {
            component: 'useSymbolStore',
            action: 'fetchSymbols'
          });
          
          // APIから銘柄リストを取得
          const symbols = await api.fetchSymbols(exchangeType);
          
          logger.info(`Fetched ${symbols.length} symbols from API`, {
            component: 'useSymbolStore',
            action: 'fetchSymbols'
          });
          
          // お気に入り情報を保持するために、既存のシンボルとマージ
          const existingSymbols = get().symbols;
          const mergedSymbols = symbols.map(newSymbol => {
            // 既存のシンボルから同じシンボルを探す
            const existingSymbol = existingSymbols.find(s => s.symbol === newSymbol.symbol);
            // お気に入り情報を保持
            return {
              ...newSymbol,
              isFavorite: existingSymbol ? existingSymbol.isFavorite : false
            };
          });
          
          set({
            symbols: mergedSymbols,
            filteredSymbols: mergedSymbols,
            isLoading: false
          });
          
          // フィルターを適用
          const { filterOptions } = get();
          get().applyFilters(filterOptions);
          
        } catch (error) {
          logger.error(`Failed to fetch symbols: ${error}`, {
            component: 'useSymbolStore',
            action: 'fetchSymbols',
            error
          });
          
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : '銘柄の取得に失敗しました'
          });
          
          // エラー時はモックデータを使用
          set({
            symbols: mockSymbols,
            filteredSymbols: mockSymbols
          });
          
          // フィルターを適用
          const { filterOptions } = get();
          get().applyFilters(filterOptions);
        }
      },
      
      // フィルターオプションを設定
      setFilterOptions: (options: Partial<FilterOptions>) => {
        const currentOptions = get().filterOptions;
        const newOptions = { ...currentOptions, ...options };
        
        set({ filterOptions: newOptions });
        get().applyFilters(newOptions);
      },
      
      // フィルターを適用（内部メソッド）
      applyFilters: (options: FilterOptions) => {
        const { symbols } = get();
        
        let filtered = [...symbols];
        
        // 検索語でフィルター
        if (options.searchTerm) {
          const term = options.searchTerm.toLowerCase();
          filtered = filtered.filter(
            s => s.symbol.toLowerCase().includes(term) ||
                 s.baseAsset.toLowerCase().includes(term) ||
                 s.quoteAsset.toLowerCase().includes(term)
          );
        }
        
        // 基軸通貨でフィルター
        if (options.quoteAsset) {
          filtered = filtered.filter(s => s.quoteAsset === options.quoteAsset);
        }
        
        // お気に入りでフィルター
        if (options.favoritesOnly) {
          filtered = filtered.filter(s => s.isFavorite);
        }
        
        set({ filteredSymbols: filtered });
      },
      
      // お気に入りを切り替え
      toggleFavorite: (symbol: string) => {
        const { symbols } = get();
        
        const updatedSymbols = symbols.map(s =>
          s.symbol === symbol ? { ...s, isFavorite: !s.isFavorite } : s
        );
        
        set({ symbols: updatedSymbols });
        
        // フィルターを再適用
        get().applyFilters(get().filterOptions);
      },
      
      // フィルターをクリア
      clearFilters: () => {
        const clearOptions = {
          searchTerm: '',
          quoteAsset: '',
          favoritesOnly: false
        };
        
        set({ filterOptions: clearOptions });
        get().applyFilters(clearOptions);
      }
    }),
    { name: 'symbol-store' }
  )
);

// デフォルトエクスポート
export default useSymbolStore;
