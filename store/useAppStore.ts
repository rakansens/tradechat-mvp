// store/useAppStore.ts
// 更新: WebSocketの共有データ方式に対応
//
// このストアはシンボルと取引タイプの管理を一元化し、
// データフェッチの制御も担当します。
// 他のストアやコンポーネントが購読できるようにします。
//
// 主な機能:
// 1. シンボル情報の一元管理
// 2. データフェッチの一元制御
// 3. シンボル変更通知の提供
// 4. シンボル正規化処理の統一
// 5. 最後に使用したシンボルの保存と読み込み
// 6. WebSocketからのデータを保存・管理
// 7. WebSocketとRESTAPIのフォールバック機能
// 8. デバッグ情報の提供（アクティブなフェッチリクエスト、ポーリング状態など）

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';
import { dataFetchService } from '../services/dataFetchService';
import { BitgetApiClient } from '../services/bitgetApi';
import { OHLCData, Timeframe } from '../types/chart';
import { OrderBookData } from '../types/market';
import { normalizeSymbol } from '../lib/utils';
import { socketService } from '../services/socketService';

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

// アクティブデータ取得の型定義
export interface ActiveFetch {
  symbol: string;
  type: 'orderbook' | 'chart' | 'trades';
  exchangeType: ExchangeType;
  abortController: AbortController;
  timestamp: number;
  duration?: number; // 実行時間（ミリ秒）
}

// ポーリング情報の型定義
export interface PollingInfo {
  active: boolean;
  lastPollTime: number | null;
  interval: number;
  type: string;
}

// アプリストアの状態型定義
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
  orderBook: OrderBookData | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // データフェッチ制御
  activeFetches: ActiveFetch[];
  
  // デバッグ情報
  isDebugMode: boolean;
  symbolChangeHistory: Array<{
    from: string;
    to: string;
    timestamp: number;
    reason?: string;
  }>;
  pollingInfo: {
    orderbook: PollingInfo;
    chart: PollingInfo;
  };
  
  // WebSocket関連の状態
  wsConnected: boolean;
  wsSubscriptions: {
    orderbook: boolean;
    chart: boolean;
  };
  
  // 内部ポーリング状態
  _pollingActive: boolean;
  _pollingTimers: Record<string, NodeJS.Timeout>;
  _wsUnsubscribeFunctions: Record<string, () => void>;
  
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
  
  // デバッグ関連のアクション
  toggleDebugMode: () => void;
  getActiveFetchesInfo: () => ActiveFetch[];
  getPollingStatus: () => { orderbook: PollingInfo; chart: PollingInfo };
  getSymbolChangeHistory: () => Array<{ from: string; to: string; timestamp: number; reason?: string }>;
  getWebSocketStatus: () => { connected: boolean; subscriptions: { orderbook: boolean; chart: boolean } };
  unsubscribeAllWebSockets: () => void;
  
  // チャートデータポーリング関連のアクション
  startChartDataPolling: () => void;
  stopChartDataPolling: () => void;
  
  // アプリケーション初期化アクション
  initializeApp: () => { symbol: string; exchangeType: ExchangeType };
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

// ポーリング間隔（ミリ秒）
const POLLING_INTERVAL = 30000; // 30秒

// Zustandストア作成
export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 初期状態 - シンボル関連
      // 初期値を空に設定し、アプリケーション起動時に明示的にシンボルを設定する
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
      
      // 初期状態 - チャート関連
      chartData: [],
      currentTimeFrame: '1d',
      isLoadingChartData: false,
      chartError: null,
      
      // 初期状態 - オーダーブック関連
      orderBook: null,
      isLoadingOrderBook: false,
      orderBookError: null,
      
      // データフェッチ制御
      activeFetches: [],
      
      // ポーリング状態
      _pollingActive: false,
      _pollingTimers: {} as Record<string, NodeJS.Timeout>,
      
      // デバッグ情報
      isDebugMode: process.env.NODE_ENV === 'development',
      symbolChangeHistory: [],
      pollingInfo: {
        orderbook: {
          active: false,
          lastPollTime: null,
          interval: POLLING_INTERVAL,
          type: 'orderbook'
        },
        chart: {
          active: false,
          lastPollTime: null,
          interval: 30000, // 30秒
          type: 'chart'
        }
      },
      
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
          component: 'useAppStore',
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
            component: 'useAppStore',
            action: 'setCurrentSymbol'
          });
          return;
        }
        
        // ログ出力
        logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
          component: 'useAppStore',
          action: 'setCurrentSymbol'
        });
        
        // 進行中のリクエストをキャンセル
        get().cancelAllFetches();
        
        // すべてのポーリングを停止
        get().stopOrderBookPolling();
        get().stopChartDataPolling();
        
        // WebSocketの購読を解除
        get().unsubscribeAllWebSockets();
        
        // シンボル変更前に明示的にキャッシュをクリア
        logger.info(`Clearing cache for symbol change from ${currentSymbol} to ${symbol}`, {
          component: 'useAppStore',
          action: 'setCurrentSymbol'
        });
        
        // 両方のシンボル形式（正規化前後）でキャッシュをクリア
        dataFetchService.handleSymbolChange(symbol);
        dataFetchService.handleSymbolChange(normalizedSymbol);
        
        // シンボルを更新
        // 最後に使用したシンボルをローカルストレージに保存
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastUsedSymbol', symbol);
        }
        
        set({
          currentSymbol: symbol,
          // ローディング状態をリセット
          isLoadingOrderBook: true,
          isLoadingChartData: true,
          // エラー状態をリセット
          orderBookError: null,
          chartError: null,
          // 一時的にデータをクリア（ローディング表示のため）
          orderBook: { asks: [], bids: [], symbol: symbol, timestamp: Date.now() }
        });
        
        // データを取得
        get().fetchOrderBook();
        get().fetchChartData();
        
        // ポーリングを再開（少し遅延させる）
        setTimeout(() => {
          get().startOrderBookPolling();
          get().startChartDataPolling();
        }, 300);
      },
      
      // 取引種別を設定
      setExchangeType: (type: ExchangeType) => {
        // 現在の取引種別と同じ場合は何もしない
        if (get().exchangeType === type) {
          logger.info(`取引種別が既に${type}に設定されているため、更新をスキップします`, {
            component: 'useAppStore',
            action: 'setExchangeType',
            timestamp: Date.now()
          });
          return;
        }
        
        const currentType = get().exchangeType;
        const fromFuturesToSpot = currentType === 'futures' && type === 'spot';
        
        logger.info(`取引種別を${currentType}から${type}に変更します`, {
          component: 'useAppStore',
          action: 'setExchangeType',
          timestamp: Date.now(),
          fromFuturesToSpot: fromFuturesToSpot ? '先物→現物の切り替え検出' : '他の切り替えパターン'
        });
        
        // 進行中のリクエストをキャンセル
        get().cancelAllFetches();
        
        // すべてのポーリングを停止
        get().stopOrderBookPolling();
        get().stopChartDataPolling();
        
        // WebSocketの購読を解除
        get().unsubscribeAllWebSockets();
        
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
              component: 'useAppStore',
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
          // ローディング状態をリセット
          isLoadingOrderBook: true,
          isLoadingChartData: true,
          // エラー状態をリセット
          orderBookError: null,
          chartError: null
        });
        
        logger.info(`取引種別変更時に銘柄を保持: ${currentSymbol}`, {
          component: 'useAppStore',
          action: 'setExchangeType',
          type,
          currentSymbol
        });
        
        // データを再取得
        get().fetchOrderBook();
        get().fetchChartData();
        
        // ポーリングを再開（少し遅延させる）
        setTimeout(() => {
          get().startOrderBookPolling();
          get().startChartDataPolling();
        }, 300);
      },
      
      // シンボル一覧を取得
      fetchSymbols: async (exchangeType: ExchangeType) => {
        try {
          set({ isLoadingSymbols: true, symbolError: null });
          
          // BitgetApiClientを使用して実際のAPIからデータを取得
          const api = new BitgetApiClient({}, exchangeType);
          
          logger.info(`Fetching symbols from API for ${exchangeType}`, {
            component: 'useAppStore',
            action: 'fetchSymbols'
          });
          
          // APIから銘柄リストを取得
          const symbols = await api.fetchSymbols(exchangeType);
          
          logger.info(`Fetched ${symbols.length} symbols from API`, {
            component: 'useAppStore',
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
          
          // 優先順位付けの設定
          const prioritySymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'MATIC', 'ADA', 'DOT', 'LINK'];
          
          // 銘柄を優先順位でソート
          const sortedSymbols = [...mergedSymbols].sort((a, b) => {
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
            component: 'useAppStore',
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
            component: 'useAppStore',
            action: 'fetchSymbols',
            error
          });
          
          set({
            isLoadingSymbols: false,
            symbolError: error instanceof Error ? error.message : '銘柄の取得に失敗しました'
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
      
      // タイムフレームを更新
      updateTimeFrame: async (timeFrame: Timeframe) => {
        // 現在のタイムフレームと同じ場合は何もしない
        const currentTimeFrame = get().currentTimeFrame;
        if (timeFrame === currentTimeFrame) {
          logger.info(`Timeframe already set to ${timeFrame}, skipping update`, {
            component: 'useAppStore',
            action: 'updateTimeFrame'
          });
          return;
        }
        
        // ログ出力
        logger.info(`Changing timeframe from ${currentTimeFrame} to ${timeFrame}`, {
          component: 'useAppStore',
          action: 'updateTimeFrame'
        });
        
        // チャートデータ取得をキャンセル
        get().cancelFetch('chart');
        
        // 先にタイムフレームを更新してUIに即反映
        set({ 
          currentTimeFrame: timeFrame,
          isLoadingChartData: true,
          chartError: null
        });
        
        // 少し遅延させてから新しいデータを取得
        // これにより、UIの更新が先に行われる
        setTimeout(async () => {
          try {
            // 最新のタイムフレームを取得（非同期処理中に変更された可能性がある）
            const latestTimeFrame = get().currentTimeFrame;
            
            // タイムフレームが変更されていないことを確認
            if (timeFrame === latestTimeFrame) {
              // 新しいデータを取得
              await get().fetchChartData(undefined, timeFrame);
            } else {
              logger.info(`Timeframe changed during async operation from ${timeFrame} to ${latestTimeFrame}, skipping fetch`, {
                component: 'useAppStore',
                action: 'updateTimeFrame'
              });
            }
          } catch (e) {
            logger.error('Failed to fetch data after timeframe update', {
              component: 'useAppStore',
              action: 'updateTimeFrame',
              error: e
            });
          }
        }, 50);
      },
      
      // チャートデータを取得
      fetchChartData: async (symbol?: string, timeFrame?: Timeframe) => {
        // チャートデータ取得をキャンセル
        get().cancelFetch('chart');
        
        // 新しいAbortControllerを作成
        const abortController = new AbortController();
        
        // 最新の状態を取得
        const state = get();
        const finalSymbol = symbol || state.currentSymbol;
        const finalTimeFrame = timeFrame || state.currentTimeFrame;
        const { exchangeType } = state;
        
        // 正規化したシンボル
        const normalizedSymbol = state._normalizeSymbol(finalSymbol);
        
        // アクティブフェッチに追加
        set(state => ({
          activeFetches: [
            ...state.activeFetches,
            {
              symbol: normalizedSymbol,
              type: 'chart',
              exchangeType,
              abortController,
              timestamp: Date.now()
            }
          ],
          isLoadingChartData: true,
          chartError: null
        }));
        
        try {
          logger.info(`Fetching chart data for ${normalizedSymbol} (${finalTimeFrame})`, {
            component: 'useAppStore',
            action: 'fetchChartData'
          });
          
          // 共通サービスを使用してチャートデータを取得
          const data = await dataFetchService.fetchChartData(
            normalizedSymbol,
            finalTimeFrame,
            exchangeType,
            abortController.signal
          );
          
          // 重要: 現在のシンボルとリクエストされたシンボルが一致するか確認
          // これにより古いリクエストの結果が新しいシンボルを上書きするのを防止
          const latestState = get();
          const latestNormalizedSymbol = latestState._normalizeSymbol(latestState.currentSymbol);
          
          if (latestNormalizedSymbol !== normalizedSymbol) {
            logger.info(`シンボルが変更されています。古いリクエスト結果を破棄: ${normalizedSymbol} != ${latestNormalizedSymbol}`, {
              component: 'useAppStore',
              action: 'fetchChartData'
            });
            return;
          }
          
          // アクティブフェッチから削除
          set(state => ({
            activeFetches: state.activeFetches.filter(
              fetch => !(fetch.type === 'chart' && fetch.symbol === normalizedSymbol)
            ),
            chartData: data,
            isLoadingChartData: false
          }));
          
          return data;
        } catch (error: any) {
          // AbortErrorの場合は静かに失敗（キャンセルされたリクエスト）
          if (error.name === 'AbortError') {
            logger.info(`チャートデータ取得がキャンセルされました: ${normalizedSymbol}`, {
              component: 'useAppStore',
              action: 'fetchChartData'
            });
            return;
          }
          
          // エラーハンドリング
          let errorMessage = 'チャートデータの取得に失敗しました';
          
          if (error.response) {
            errorMessage = `API エラー: ${error.response.status} ${error.response.statusText}`;
          } else if (error.request) {
            errorMessage = 'サーバーからの応答がありません';
          } else {
            errorMessage = `エラー: ${error.message}`;
          }
          
          logger.error(errorMessage, {
            component: 'useAppStore',
            action: 'fetchChartData',
            error
          });
          
          // アクティブフェッチから削除
          set(state => ({
            activeFetches: state.activeFetches.filter(
              fetch => !(fetch.type === 'chart' && fetch.symbol === normalizedSymbol)
            ),
            isLoadingChartData: false,
            chartError: errorMessage
          }));
        }
      },
      
      // 最新のローソク足を更新（リアルタイムデータ用）
      updateLastCandle: (newCandle: OHLCData) => {
        set((state) => {
          // 既存のデータ配列を取得
          const data = [...state.chartData];
          
          // データがない場合は何もしない
          if (data.length === 0) {
            return state;
          }
          
          // 最後のローソク足を取得
          const lastCandle = data[data.length - 1];
          
          // 同じ時間のローソク足なら更新、そうでなければ追加
          if (lastCandle && lastCandle.time === newCandle.time) {
            // 最後のローソク足を更新
            data[data.length - 1] = newCandle;
          } else {
            // 新しいローソク足を追加
            data.push(newCandle);
            
            // データが多すぎる場合は古いものを削除
            if (data.length > 500) {
              data.shift();
            }
          }
          
          return { chartData: data };
        });
      },
      
      // オーダーブックを取得
      fetchOrderBook: async (symbol?: string) => {
        // オーダーブック取得をキャンセル
        get().cancelFetch('orderbook');
        
        // 新しいAbortControllerを作成
        const abortController = new AbortController();
        
        // 最新の状態を取得
        const state = get();
        const finalSymbol = symbol || state.currentSymbol;
        const { exchangeType } = state;
        
        // 正規化したシンボル
        const normalizedSymbol = state._normalizeSymbol(finalSymbol);
        
        // アクティブフェッチに追加
        set(state => ({
          activeFetches: [
            ...state.activeFetches,
            {
              symbol: normalizedSymbol,
              type: 'orderbook',
              exchangeType,
              abortController,
              timestamp: Date.now()
            }
          ],
          isLoadingOrderBook: true,
          orderBookError: null
        }));
        
        try {
          logger.info(`Fetching order book for ${normalizedSymbol}`, {
            component: 'useAppStore',
            action: 'fetchOrderBook'
          });
          
          // 共通サービスを使用してオーダーブックを取得
          const orderBook = await dataFetchService.fetchOrderBook(
            normalizedSymbol,
            exchangeType,
            abortController.signal
          );
          
          // 重要: 現在のシンボルとリクエストされたシンボルが一致するか確認
          // これにより古いリクエストの結果が新しいシンボルを上書きするのを防止
          const latestState = get();
          const latestNormalizedSymbol = latestState._normalizeSymbol(latestState.currentSymbol);
          
          if (latestNormalizedSymbol !== normalizedSymbol) {
            logger.info(`シンボルが変更されています。古いリクエスト結果を破棄: ${normalizedSymbol} != ${latestNormalizedSymbol}`, {
              component: 'useAppStore',
              action: 'fetchOrderBook'
            });
            return;
          }
          
          // アクティブフェッチから削除
          set(state => ({
            activeFetches: state.activeFetches.filter(
              fetch => !(fetch.type === 'orderbook' && fetch.symbol === normalizedSymbol)
            ),
            orderBook,
            isLoadingOrderBook: false
          }));
        } catch (error: any) {
          // AbortErrorの場合は静かに失敗（キャンセルされたリクエスト）
          if (error.name === 'AbortError') {
            logger.info(`オーダーブック取得がキャンセルされました: ${normalizedSymbol}`, {
              component: 'useAppStore',
              action: 'fetchOrderBook'
            });
            return;
          }
          
          // エラーハンドリング
          logger.error(`オーダーブック取得エラー: ${error.message}`, {
            component: 'useAppStore',
            action: 'fetchOrderBook',
            symbol: normalizedSymbol,
            error
          });
          
          // アクティブフェッチから削除
          set(state => ({
            activeFetches: state.activeFetches.filter(
              fetch => !(fetch.type === 'orderbook' && fetch.symbol === normalizedSymbol)
            ),
            isLoadingOrderBook: false,
            orderBookError: error instanceof Error ? error.message : 'オーダーブックの取得に失敗しました'
          }));
        }
      },
      
      // オーダーブックのポーリングを開始
      startOrderBookPolling: () => {
        // シンボル正規化関数（一貫性のある正規化処理のため）
        const normalizeSymbol = get()._normalizeSymbol;
        
        // 現在のシンボルを取得して正規化
        const symbol = get().currentSymbol;
        
        // シンボルが空の場合はポーリングを開始しない
        if (!symbol) {
          logger.info(`Cannot start polling with empty symbol`, {
            component: 'useAppStore',
            action: 'startOrderBookPolling'
          });
          return;
        }
        
        const normalizedSymbol = normalizeSymbol(symbol);
        
        // 既存のポーリングを停止
        get().stopOrderBookPolling();
        
        // ポーリングアクティブフラグをオンに
        set(state => ({
          _pollingActive: true,
          pollingInfo: {
            ...state.pollingInfo,
            orderbook: {
              ...state.pollingInfo.orderbook,
              active: true,
              lastPollTime: Date.now()
            }
          }
        }));
        
        logger.info(`Starting order book polling for ${normalizedSymbol} (original: ${symbol})`, {
          component: 'useAppStore',
          action: 'startOrderBookPolling'
        });
        
        // ポーリング関数
        const poll = async () => {
          // ポーリングが停止されているか確認
          if (!get()._pollingActive) {
            logger.info('Polling is inactive, exiting poll function', {
              component: 'useAppStore',
              action: 'orderBookPoll'
            });
            return;
          }
          
          // 最新の状態を取得
          const currentState = get();
          const currentSymbol = currentState.currentSymbol;
          const currentNormalizedSymbol = normalizeSymbol(currentSymbol);
          
          // シンボルが変更されている場合はポーリングを停止
          if (normalizedSymbol !== currentNormalizedSymbol) {
            logger.info(`Symbol changed from ${normalizedSymbol} to ${currentNormalizedSymbol}, stopping order book polling`, {
              component: 'useAppStore',
              action: 'orderBookPoll'
            });
            get().stopOrderBookPolling();
            return;
          }
          
          try {
            // データ取得（明示的に正規化したシンボルを渡す）
            await currentState.fetchOrderBook(normalizedSymbol);
            
            // 次回のポーリングをスケジュール
            if (get()._pollingActive) {
              // ポーリング情報を更新
              set(state => ({
                pollingInfo: {
                  ...state.pollingInfo,
                  orderbook: {
                    ...state.pollingInfo.orderbook,
                    lastPollTime: Date.now()
                  }
                }
              }));
              
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, POLLING_INTERVAL);
              
              // タイマーを保存
              set(state => ({
                _pollingTimers: {
                  ...state._pollingTimers,
                  orderbook: timer
                }
              }));
            }
          } catch (error) {
            logger.error(`Error during order book polling: ${error}`, {
              component: 'useAppStore',
              action: 'orderBookPoll',
              error
            });
            
            // エラーが発生してもポーリングを継続
            if (get()._pollingActive) {
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, POLLING_INTERVAL);
              
              // タイマーを保存
              set(state => ({
                _pollingTimers: {
                  ...state._pollingTimers,
                  orderbook: timer
                }
              }));
            }
          }
        };
        
        // 初回ポーリングを開始
        poll();
      },
      
      // オーダーブックのポーリングを停止
      stopOrderBookPolling: () => {
        logger.info(`Stopping order book polling`, {
          component: 'useAppStore',
          action: 'stopOrderBookPolling'
        });
        
        // ポーリングアクティブフラグをオフに
        set(state => ({
          _pollingActive: false,
          pollingInfo: {
            ...state.pollingInfo,
            orderbook: {
              ...state.pollingInfo.orderbook,
              active: false
            }
          }
        }));
        
        // タイマーをクリア
        const { _pollingTimers } = get();
        if (_pollingTimers.orderbook) {
          clearTimeout(_pollingTimers.orderbook);
          
          // タイマーを削除
          set(state => ({
            _pollingTimers: {
              ...state._pollingTimers,
              orderbook: null as unknown as NodeJS.Timeout
            }
          }));
        }
        
        // オーダーブック取得をキャンセル
        get().cancelFetch('orderbook');
      },
      
      // 特定タイプのデータ取得をキャンセル
      cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => {
        const activeFetches = get().activeFetches;
        
        // キャンセル対象のフェッチを特定
        const fetchesToCancel = symbol
          ? activeFetches.filter(fetch => fetch.type === type && fetch.symbol === symbol)
          : activeFetches.filter(fetch => fetch.type === type);
        
        // 各フェッチをキャンセル
        fetchesToCancel.forEach(fetch => {
          logger.info(`Cancelling ${fetch.type} fetch for ${fetch.symbol}`, {
            component: 'useAppStore',
            action: 'cancelFetch'
          });
          fetch.abortController.abort();
        });
        
        // アクティブフェッチリストから削除
        set(state => ({
          activeFetches: state.activeFetches.filter(fetch => 
            !fetchesToCancel.some(f => f.type === fetch.type && f.symbol === fetch.symbol)
          )
        }));
      },
      
      // すべてのデータ取得をキャンセル
      cancelAllFetches: () => {
        const activeFetches = get().activeFetches;
        
        // 各フェッチをキャンセル
        activeFetches.forEach(fetch => {
          logger.info(`Cancelling all fetches: ${fetch.type} for ${fetch.symbol}`, {
            component: 'useAppStore',
            action: 'cancelAllFetches'
          });
          fetch.abortController.abort();
        });
        
        // アクティブフェッチリストをクリア
        set({ activeFetches: [] });
      },
      
      /**
       * WebSocketの購読を解除
       */
      unsubscribeAllWebSockets: () => {
        const { _wsUnsubscribeFunctions } = get();
        
        // _wsUnsubscribeFunctionsが存在する場合のみ処理を実行
        if (_wsUnsubscribeFunctions && typeof _wsUnsubscribeFunctions === 'object') {
          // すべての購読解除関数を実行
          Object.values(_wsUnsubscribeFunctions).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          });
          
          // 購読解除関数をクリア
          set({
            _wsUnsubscribeFunctions: {},
            wsSubscriptions: {
              orderbook: false,
              chart: false
            }
          });
          
          logger.info('すべてのWebSocket購読を解除しました', {
            component: 'useAppStore',
            action: 'unsubscribeAllWebSockets'
          });
        } else {
          // _wsUnsubscribeFunctionsが存在しない場合は初期化だけ行う
          logger.warn('WebSocket購読関数が存在しません', {
            component: 'useAppStore',
            action: 'unsubscribeAllWebSockets',
            wsUnsubscribeFunctions: _wsUnsubscribeFunctions
          });
          
          set({
            _wsUnsubscribeFunctions: {},
            wsSubscriptions: {
              orderbook: false,
              chart: false
            }
          });
        }
      },
      
      /**
       * WebSocketの接続状態を取得
       */
      getWebSocketStatus: () => {
        const { wsConnected, wsSubscriptions } = get();
        return { connected: wsConnected, subscriptions: wsSubscriptions };
      },
      
      // アプリケーション初期化時に呼び出す関数
      initializeApp: () => {
        const state = get();
        
        // 最後に使用したシンボルと取引種別を取得
        let lastUsedSymbol = state.currentSymbol;
        let lastUsedExchangeType: ExchangeType = 'spot'; // デフォルト値を'spot'に設定
        
        // ローカルストレージから値を取得（ブラウザ環境の場合）
        if (typeof window !== 'undefined') {
          // シンボルの取得
          const storedSymbol = localStorage.getItem('lastUsedSymbol');
          if (storedSymbol) {
            lastUsedSymbol = storedSymbol;
          }
          
          // 取引種別の取得（複数のキーをチェック）
          const storedExchangeType =
            localStorage.getItem('lastUsedExchangeType') ||
            localStorage.getItem('selectedInstrumentType');
            
          if (storedExchangeType && (storedExchangeType === 'spot' || storedExchangeType === 'futures')) {
            lastUsedExchangeType = storedExchangeType as ExchangeType;
            logger.info(`ローカルストレージから取引種別を読み込みました: ${lastUsedExchangeType}`, {
              component: 'useAppStore',
              action: 'initializeApp'
            });
          }
        }
        
        // シンボルが空の場合はデフォルト値を設定
        if (!lastUsedSymbol) {
          lastUsedSymbol = 'BTCUSDT';
          
          logger.info(`シンボルが見つかりません、デフォルト値を設定します: ${lastUsedSymbol}`, {
            component: 'useAppStore',
            action: 'initializeApp'
          });
        }
        
        // 取引種別が空の場合はデフォルト値を設定
        if (!lastUsedExchangeType) {
          lastUsedExchangeType = 'spot';
          
          logger.info(`取引種別が見つかりません、デフォルト値を設定します: ${lastUsedExchangeType}`, {
            component: 'useAppStore',
            action: 'initializeApp'
          });
        }
        
        // 明示的に状態を更新
        set({
          currentSymbol: lastUsedSymbol,
          exchangeType: lastUsedExchangeType
        });
        
        // ローカルストレージに保存（値が変更された場合）
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastUsedSymbol', lastUsedSymbol);
          localStorage.setItem('lastUsedExchangeType', lastUsedExchangeType);
          localStorage.setItem('selectedInstrumentType', lastUsedExchangeType); // 互換性のため
          
          // リフレッシュ時に銘柄が保持されるように、明示的に保存
          logger.info(`リフレッシュ時の銘柄保持のため、明示的に保存: ${lastUsedSymbol}`, {
            component: 'useAppStore',
            action: 'initializeApp'
          });
        }
        
        logger.info(`Initializing app with symbol: ${lastUsedSymbol}, exchange type: ${lastUsedExchangeType}`, {
          component: 'useAppStore',
          action: 'initializeApp'
        });
        
        // データを取得
        state.fetchOrderBook();
        state.fetchChartData();
        
        // WebSocketの接続状態を監視
        const checkWebSocketConnection = () => {
          const isConnected = socketService.isConnected();
          set({ wsConnected: isConnected });
          
          // 正規化したシンボル
          const normalizedSymbol = normalizeSymbol(lastUsedSymbol);
          
          // WebSocketが接続されている場合はWebSocketを使用
          if (isConnected) {
            // オーダーブックのWebSocket購読を開始
            const orderBookUnsubscribe = dataFetchService.subscribeOrderBookRealtime(
              normalizedSymbol,
              (data) => {
                set({
                  orderBook: data,
                  isLoadingOrderBook: false,
                  orderBookError: null
                });
              },
              lastUsedExchangeType
            );
            
            // チャートデータのWebSocket購読を開始
            const chartDataUnsubscribe = dataFetchService.subscribeKlineRealtime(
              normalizedSymbol,
              state.currentTimeFrame,
              (data) => {
                state.updateLastCandle(data);
              },
              lastUsedExchangeType
            );
            
            // 購読解除関数を保存
            set(state => ({
              _wsUnsubscribeFunctions: {
                ...state._wsUnsubscribeFunctions,
                orderbook: orderBookUnsubscribe,
                chart: chartDataUnsubscribe
              },
              wsSubscriptions: {
                orderbook: true,
                chart: true
              }
            }));
            
            logger.info('WebSocketを使用したリアルタイムデータ購読を開始しました', {
              component: 'useAppStore',
              action: 'initializeApp',
              symbol: normalizedSymbol
            });
          } else {
            // WebSocketが接続されていない場合はポーリングを使用
            state.startOrderBookPolling();
            state.startChartDataPolling();
            
            logger.info('ポーリングを使用したデータ取得を開始しました', {
              component: 'useAppStore',
              action: 'initializeApp',
              symbol: normalizedSymbol
            });
          }
        };
        
        // 初回チェック
        checkWebSocketConnection();
        
        // 定期的にWebSocketの接続状態を確認
        const wsCheckInterval = setInterval(() => {
          const currentConnected = socketService.isConnected();
          const prevConnected = get().wsConnected;
          
          // 接続状態が変わった場合
          if (currentConnected !== prevConnected) {
            set({ wsConnected: currentConnected });
            
            if (currentConnected) {
              // 接続された場合はポーリングを停止してWebSocketを使用
              get().stopOrderBookPolling();
              get().stopChartDataPolling();
              
              // WebSocketの購読を開始
              checkWebSocketConnection();
              
              logger.info('WebSocketが接続されました。WebSocketを使用したデータ取得に切り替えます', {
                component: 'useAppStore',
                action: 'wsConnectionCheck'
              });
            } else {
              // 切断された場合はWebSocketの購読を解除してポーリングを使用
              get().unsubscribeAllWebSockets();
              get().startOrderBookPolling();
              get().startChartDataPolling();
              
              logger.info('WebSocketが切断されました。ポーリングを使用したデータ取得に切り替えます', {
                component: 'useAppStore',
                action: 'wsConnectionCheck'
              });
            }
          }
        }, 10000); // 10秒ごとにチェック
        
        // タイマーを保存
        set(state => ({
          _pollingTimers: {
            ...state._pollingTimers,
            wsCheck: wsCheckInterval as unknown as NodeJS.Timeout
          }
        }));
        
        return {
          symbol: lastUsedSymbol,
          exchangeType: lastUsedExchangeType
        };
      },
      
      // チャートデータのポーリングを開始（新規追加）
      startChartDataPolling: () => {
        // シンボル正規化関数（一貫性のある正規化処理のため）
        const normalizeSymbol = get()._normalizeSymbol;
        
        // 現在のシンボルを取得して正規化
        const symbol = get().currentSymbol;
        
        // シンボルが空の場合はポーリングを開始しない
        if (!symbol) {
          logger.info(`Cannot start chart polling with empty symbol`, {
            component: 'useAppStore',
            action: 'startChartDataPolling'
          });
          return;
        }
        
        const normalizedSymbol = normalizeSymbol(symbol);
        const timeFrame = get().currentTimeFrame;
        
        // 既存のポーリングを停止
        get().stopChartDataPolling();
        
        // ポーリングアクティブフラグをオンに
        set(state => ({
          _pollingActive: true,
          pollingInfo: {
            ...state.pollingInfo,
            chart: {
              ...state.pollingInfo.chart,
              active: true,
              lastPollTime: Date.now()
            }
          }
        }));
        
        logger.info(`Starting chart data polling for ${normalizedSymbol} (timeframe: ${timeFrame})`, {
          component: 'useAppStore',
          action: 'startChartDataPolling'
        });
        
        // ポーリング関数
        const poll = async () => {
          // ポーリングが停止されているか確認
          if (!get()._pollingActive) {
            logger.info('Polling is inactive, exiting chart poll function', {
              component: 'useAppStore',
              action: 'chartDataPoll'
            });
            return;
          }
          
          // 最新の状態を取得
          const currentState = get();
          const currentSymbol = currentState.currentSymbol;
          const currentNormalizedSymbol = normalizeSymbol(currentSymbol);
          const currentTimeFrame = currentState.currentTimeFrame;
          
          // シンボルまたはタイムフレームが変更されている場合はポーリングを停止
          if (normalizedSymbol !== currentNormalizedSymbol || timeFrame !== currentTimeFrame) {
            logger.info(`Symbol or timeframe changed, stopping chart data polling`, {
              component: 'useAppStore',
              action: 'chartDataPoll',
              oldSymbol: normalizedSymbol,
              newSymbol: currentNormalizedSymbol,
              oldTimeFrame: timeFrame,
              newTimeFrame: currentTimeFrame
            });
            get().stopChartDataPolling();
            return;
          }
          
          try {
            // データ取得
            await currentState.fetchChartData(normalizedSymbol, timeFrame);
            
            // 次回のポーリングをスケジュール（チャートは30秒間隔）
            if (get()._pollingActive) {
              // ポーリング情報を更新
              set(state => ({
                pollingInfo: {
                  ...state.pollingInfo,
                  chart: {
                    ...state.pollingInfo.chart,
                    lastPollTime: Date.now()
                  }
                }
              }));
              
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, 30000); // チャートデータは30秒間隔
              
              // タイマーを保存
              set(state => ({
                _pollingTimers: {
                  ...state._pollingTimers,
                  chartData: timer
                }
              }));
            }
          } catch (error) {
            logger.error(`Error during chart data polling: ${error}`, {
              component: 'useAppStore',
              action: 'chartDataPoll',
              error
            });
            
            // エラーが発生してもポーリングを継続
            if (get()._pollingActive) {
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, 30000);
              
              // タイマーを保存
              set(state => ({
                _pollingTimers: {
                  ...state._pollingTimers,
                  chartData: timer
                }
              }));
            }
          }
        };
        
        // 初回ポーリングを開始
        poll();
      },
      
      // チャートデータのポーリングを停止（新規追加）
      stopChartDataPolling: () => {
        logger.info(`Stopping chart data polling`, {
          component: 'useAppStore',
          action: 'stopChartDataPolling'
        });
        
        // ポーリングアクティブフラグをオフに
        set(state => ({
          _pollingActive: false,
          pollingInfo: {
            ...state.pollingInfo,
            chart: {
              ...state.pollingInfo.chart,
              active: false
            }
          }
        }));
        
        // タイマーをクリア
        const { _pollingTimers } = get();
        if (_pollingTimers.chartData) {
          clearTimeout(_pollingTimers.chartData);
          
          // タイマーを削除
          set(state => ({
            _pollingTimers: {
              ...state._pollingTimers,
              chartData: null as unknown as NodeJS.Timeout
            }
          }));
        }
        
        // チャートデータ取得をキャンセル
        get().cancelFetch('chart');
      },
      
      // デバッグモードの切り替え
      toggleDebugMode: () => {
        set(state => ({ isDebugMode: !state.isDebugMode }));
      },
      
      // アクティブなフェッチリクエストの情報を取得
      getActiveFetchesInfo: () => {
        const activeFetches = get().activeFetches;
        const now = Date.now();
        
        // 実行時間を計算して返す
        return activeFetches.map(fetch => ({
          ...fetch,
          duration: now - fetch.timestamp
        }));
      },
      
      // ポーリング状態の情報を取得
      getPollingStatus: () => {
        return get().pollingInfo;
      },
      
      // シンボル変更履歴を取得
      getSymbolChangeHistory: () => {
        return get().symbolChangeHistory;
      }
    }),
    { name: 'app-store' }
  )
);

// デフォルトエクスポート
export default useAppStore;
