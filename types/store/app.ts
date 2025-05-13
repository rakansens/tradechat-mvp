// types/store/app.ts
// アプリケーション全体のストア状態型定義

import { OHLCData, Timeframe } from '../chart';
import { ExchangeType } from '../api';

/**
 * シンボル情報の型定義
 */
export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isFavorite: boolean;
}

/**
 * フィルターオプションの型定義
 */
export interface FilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

/**
 * アクティブデータ取得の型定義
 */
interface ActiveFetch {
  symbol: string;
  type: 'orderbook' | 'chart' | 'trades';
  exchangeType: ExchangeType;
  abortController: AbortController;
  timestamp: number;
}

/**
 * アプリストアの状態型定義
 */
export interface AppState {
  // シンボル関連の状態
  currentSymbol: string;
  exchangeType: ExchangeType;
  symbols: SymbolInfo[];
  filteredSymbols: SymbolInfo[];
  filterOptions: FilterOptions;
  isLoadingSymbols: boolean;
  symbolError: string | null;
  
  // チャート関連の状態
  chartData: OHLCData[];
  currentTimeFrame: Timeframe;
  isLoadingChartData: boolean;
  chartError: string | null;
  
  // オーダーブック関連の状態
  orderBook: any | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // データフェッチ制御
  activeFetches: ActiveFetch[];
  
  // ポーリング状態
  _pollingActive: boolean;
  _pollingTimers: Record<string, NodeJS.Timeout>;
  
  // 内部ユーティリティ関数
  _normalizeSymbol: (symbol: string) => string;
  
  // シンボル関連のアクション
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchSymbols: (exchangeType: ExchangeType) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  toggleFavorite: (symbol: string) => void;
  clearFilters: () => void;
  
  // チャート関連のアクション
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  fetchChartData: (symbol?: string, timeFrame?: Timeframe) => Promise<OHLCData[] | undefined>;
  updateLastCandle: (newCandle: OHLCData) => void;
  
  // オーダーブック関連のアクション
  fetchOrderBook: (symbol?: string) => Promise<void>;
  startOrderBookPolling: () => void;
  stopOrderBookPolling: () => void;
  
  // データフェッチ制御アクション
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => void;
  cancelAllFetches: () => void;
  
  // アプリケーション初期化アクション
  initializeApp: () => { symbol: string; exchangeType: ExchangeType };
  
  // チャートデータのポーリングアクション
  startChartDataPolling: () => void;
  stopChartDataPolling: () => void;
} 