// store/useSymbolStore.ts
// 作成: useAppStoreから分離したシンボル関連の状態と操作を管理するストア
// 
// このストアはシンボル情報の管理を一元化します。
// 主な機能:
// 1. シンボル情報の一元管理
// 2. シンボル変更通知の提供
// 3. シンボル正規化処理の統一
// 4. 最後に使用したシンボルの保存と読み込み
// 5. シンボルフィルタリング機能

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';
import { normalizeSymbol } from '../lib/utils';

// シンボル情報の型定義
export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isFavorite: boolean;
  // 取引量データ
  volume24h?: string; // 24時間取引量
  priceChangePercent24h?: string; // 24時間価格変動率
  lastPrice?: string; // 最新価格
}

// フィルターオプションの型定義
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

// シンボル変更履歴の型定義
export interface SymbolChangeHistory {
  from: string;
  to: string;
  timestamp: number;
  reason?: string;
}

// シンボルストアの状態型定義
export interface SymbolState {
  // シンボル関連の状態
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  filterOptions: FilterOptions;
  isLoadingSymbols: boolean;
  symbolError: string | null;
  symbolChangeHistory: SymbolChangeHistory[];
  
  // 内部ユーティリティ関数
  _normalizeSymbol: (symbol: string) => string;
  
  // シンボル関連のアクション
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  applyFilters: (options: FilterOptions) => void;
  
  // デバッグ関連のアクション
  getSymbolChangeHistory: () => SymbolChangeHistory[];
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
      // 初期状態 - シンボル関連
      currentSymbol: typeof window !== 'undefined'
        ? localStorage.getItem('lastUsedSymbol') || ''
        : '',
      exchangeType: 'spot',
      symbols: [],
      filteredSymbols: [],
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false
      },
      isLoadingSymbols: false,
      symbolError: null,
      symbolChangeHistory: [],
      
      // シンボル正規化関数（一貫性のある正規化処理のため）
      _normalizeSymbol: (symbol: string) => {
        // 共通のnormalizeSymbol関数を使用
        return normalizeSymbol(symbol);
      },
      
      // 現在のシンボルを設定
      setCurrentSymbol: (symbol: string, reason?: string) => {
        // シンボル正規化関数を取得
        const normalizeSymbol = get()._normalizeSymbol;
        
        // シンボル形式を正規化
        const normalizedSymbol = normalizeSymbol(symbol);
        
        // 現在のシンボルを正規化して比較
        const currentSymbol = get().currentSymbol;
        const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
        
        // シンボル変更のログを強化
        logger.info(`setCurrentSymbol called with symbol: ${symbol} (normalized: ${normalizedSymbol})`, {
          component: 'useSymbolStore',
          action: 'setCurrentSymbol',
          currentSymbol,
          normalizedCurrentSymbol,
          reason: reason || 'ユーザーアクション',
          timestamp: Date.now()
        });
        
        // シンボル変更履歴に追加
        set(state => ({
          symbolChangeHistory: [
            ...state.symbolChangeHistory,
            {
              from: currentSymbol,
              to: symbol,
              timestamp: Date.now(),
              reason: reason || 'ユーザーアクション'
            }
          ].slice(-20) // 最新20件のみ保持
        }));
        
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
        
        // 最後に使用したシンボルをローカルストレージに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastUsedSymbol', symbol);
        }
        
        set({
          currentSymbol: symbol,
        });
      },
      
      // 取引種別を設定
      setExchangeType: (type: ExchangeType) => {
        // 現在の取引種別と同じ場合は何もしない
        if (get().exchangeType === type) {
          logger.info(`取引種別が既に${type}に設定されているため、更新をスキップします`, {
            component: 'useSymbolStore',
            action: 'setExchangeType',
            timestamp: Date.now()
          });
          return;
        }
        
        const currentType = get().exchangeType;
        const fromFuturesToSpot = currentType === 'futures' && type === 'spot';
        
        logger.info(`取引種別を${currentType}から${type}に変更します`, {
          component: 'useSymbolStore',
          action: 'setExchangeType',
          timestamp: Date.now(),
          fromFuturesToSpot: fromFuturesToSpot ? '先物→現物の切り替え検出' : '他の切り替えパターン'
        });
        
        // 取引種別を更新
        // 最後に使用した取引種別をローカルストレージに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastUsedExchangeType', type);
          localStorage.setItem('selectedInstrumentType', type); // 互換性のため
          
          // 現在の銘柄も保存して、リフレッシュ時に保持されるようにする
          const currentSymbol = get().currentSymbol;
          if (currentSymbol) {
            localStorage.setItem('lastUsedSymbol', currentSymbol);
            
            logger.info(`取引種別変更時に銘柄を保存: ${currentSymbol}`, {
              component: 'useSymbolStore',
              action: 'setExchangeType',
              type,
              currentSymbol
            });
          }
        }
        
        // 現在の銘柄を保持
        const currentSymbol = get().currentSymbol;
        
        set({
          exchangeType: type,
          // 現在の銘柄を明示的に保持
          currentSymbol: currentSymbol,
        });
        
        logger.info(`取引種別変更時に銘柄を保持: ${currentSymbol}`, {
          component: 'useSymbolStore',
          action: 'setExchangeType',
          type,
          currentSymbol
        });
      },
      
      // シンボル一覧を取得
      fetchSymbols: async (exchangeType: ExchangeType) => {
        try {
          set({ isLoadingSymbols: true, symbolError: null });
          
          // 実際の実装ではAPIからデータを取得
          // ここではモックデータを使用
          const symbols = mockSymbols;
          
          // 優先順位付けの設定
          const prioritySymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'MATIC', 'ADA', 'DOT', 'LINK'];
          
          // 銘柄を優先順位でソート
          const sortedSymbols = [...symbols].sort((a, b) => {
            // お気に入りを最優先
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            
            // 基軸通貨がUSDTの銘柄を優先
            if (a.quoteAsset === 'USDT' && b.quoteAsset !== 'USDT') return -1;
            if (a.quoteAsset !== 'USDT' && b.quoteAsset === 'USDT') return 1;
            
            // 同じ基軸通貨の場合の並べ替えロジック
            if (a.quoteAsset === b.quoteAsset) {
              // 優先銘柄リストにある場合
              const aIndex = prioritySymbols.indexOf(a.baseAsset);
              const bIndex = prioritySymbols.indexOf(b.baseAsset);
              
              // 両方がリストにある場合はリスト順
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
              // 片方だけリストにある場合はそちらを優先
              if (aIndex !== -1) return -1;
              if (bIndex !== -1) return 1;
              
              // 取引量データがあれば、取引量の多い順に並べ替え
              if (a.volume24h && b.volume24h) {
                const aVolume = parseFloat(a.volume24h);
                const bVolume = parseFloat(b.volume24h);
                
                // 有効な数値の場合のみ比較
                if (!isNaN(aVolume) && !isNaN(bVolume) && aVolume !== bVolume) {
                  return bVolume - aVolume; // 取引量の多い順
                }
              }
              
              // 価格変動率があれば、変動率の大きい順に並べ替え
              if (a.priceChangePercent24h && b.priceChangePercent24h) {
                const aChange = Math.abs(parseFloat(a.priceChangePercent24h));
                const bChange = Math.abs(parseFloat(b.priceChangePercent24h));
                
                // 有効な数値の場合のみ比較
                if (!isNaN(aChange) && !isNaN(bChange) && aChange !== bChange) {
                  return bChange - aChange; // 変動率の大きい順
                }
              }
            }
            
            // それ以外はアルファベット順
            return a.symbol.localeCompare(b.symbol);
          });
          
          logger.info(`Sorted ${sortedSymbols.length} symbols by priority`, {
            component: 'useSymbolStore',
            action: 'fetchSymbols'
          });
          
          set({
            symbols: sortedSymbols,
            filteredSymbols: sortedSymbols,
            isLoadingSymbols: false
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
            isLoadingSymbols: false,
            symbolError: error instanceof Error ? error.message : 'シンボルの取得に失敗しました'
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
      },
      
      // シンボル変更履歴を取得
      getSymbolChangeHistory: () => {
        return get().symbolChangeHistory;
      }
    }),
    { name: 'symbol-store' }
  )
);

// デフォルトエクスポート
export default useSymbolStore;