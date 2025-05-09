// types/store.ts
// 更新: ストア関連の型定義、AppState型を追加
//
// このファイルはZustandストアの型定義を集約しています。
// 各ストアの状態とアクションの型を定義し、型安全性を確保します。
// リアルタイム更新用のメソッドも含みます。

import { OHLCData, Timeframe, ChartType } from './chart';
import { ExchangeType } from './api';
import { BitgetApiClient } from '../services/bitgetApi';

/**
 * インジケーターの種類
 */
export type IndicatorType = 'rsi' | 'macd' | 'ichimoku' | 'bollinger' | 'ema';

/**
 * アクティブなインジケーターの設定
 */
export interface ActiveIndicator {
  type: IndicatorType;
  params: Record<string, any>;
}

/**
 * 描画ツールの種類
 */
export type DrawingToolType = 'fibonacci' | 'rectangle' | 'line' | 'arrow' | 'text';

/**
 * チャートデータストアの状態
 */
export interface ChartDataState {
  // 状態
  data: OHLCData[];
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  _abortController: AbortController | null; // リクエストキャンセル用
  
  // アクション
  fetchData: (symbol: string, timeFrame: Timeframe, signal?: AbortSignal, useCache?: boolean) => Promise<OHLCData[]>;
  updateData: (data: OHLCData) => void;
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  updateSymbol: (symbol: string) => Promise<void>;
  
  // リアルタイム更新用のアクション
  updateLastCandle: (newCandle: OHLCData) => void;
}

/**
 * チャート設定ストアの状態
 */
export interface ChartConfigState {
  // 状態
  chartType: ChartType;
  exchangeType: ExchangeType;
  
  // アクション
  setChartType: (chartType: ChartType) => void;
  setExchangeType: (type: ExchangeType) => void;
}

/**
 * インジケーターストアの状態
 */
export interface IndicatorState {
  // 状態
  activeIndicators: ActiveIndicator[];
  
  // アクション
  toggleIndicator: (indicator: IndicatorType, params?: Record<string, any>) => void;
  updateIndicatorParams: (indicator: IndicatorType, params: Record<string, any>) => void;
  clearAllIndicators: () => void;
  getIndicatorParams: (indicator: IndicatorType) => Record<string, any> | undefined;
  isIndicatorActive: (indicator: IndicatorType) => boolean;
}

/**
 * 描画ツールストアの状態
 */
export interface DrawingToolState {
  // 状態
  activeDrawingTools: DrawingToolType[];
  
  // アクション
  toggleDrawingTool: (tool: DrawingToolType) => void;
  clearAllDrawingTools: () => void;
}

/**
 * リアルタイム更新ストアの状態
 */
export interface RealTimeState {
  // 状態
  useRealTimeData: boolean;
  bitgetApi: BitgetApiClient | null;
  lastSubscriptionKey: string; // 最後に購読したキー
  
  // 公開アクション
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  toggleRealTimeData: () => void;
  initializeApi: (exchangeType: ExchangeType) => void;
  
  // 内部アクション
  _debouncedStartRealTimeUpdates: () => void;
  _startRealTimeUpdatesImpl: () => void;
}

/**
 * UIストアの状態
 */
export interface UIState {
  // 状態
  activeTab: TabType;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  
  // アクション
  setActiveTab: (tab: TabType) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

/**
 * タブの種類
 */
export type TabType = 'chart' | 'orderbook' | 'trades' | 'positions' | 'settings';

/**
 * マーケットストアの状態
 */
export interface MarketState {
  // 選択されたシンボル
  currentSymbol: string;
  exchangeType: ExchangeType;
  
  // オーダーブック関連
  orderBook: any | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // 取引履歴関連
  trades: any[];
  isLoadingTrades: boolean;
  tradesError: string | null;
  
  // 市場統計関連
  marketStats: any | null;
  isLoadingMarketStats: boolean;
  marketStatsError: string | null;
  
  // 銘柄情報関連
  symbols: any[];
  isLoadingSymbols: boolean;
  symbolsError: string | null;
  
  // デモモード状態
  isDemoMode: boolean;
  
  // ポーリング状態
  isPolling: boolean;
  pollingInterval: number;
  
  // アクション
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchOrderBook: (symbolOverride?: string, signal?: AbortSignal) => Promise<void>;
  clearOrderBook: () => void;
  setDemoMode: (isDemo: boolean) => void;
  
  // ポーリング管理アクション
  startPolling: () => void;
  stopPolling: () => void;
  setPollingInterval: (interval: number) => void;
}

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
  applyFilters: (options: FilterOptions) => void;
  
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
