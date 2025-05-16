// store/rootStore.ts
// 更新: チャートスライス、エントリースライス、チャットスライス、UIスライス、マーケットスライスをルートストアに統合
// 更新: ChartConfigSliceを追加してrootStoreに統合
// 更新: DrawingToolSliceを追加してrootStoreに統合
// 更新: IndicatorSliceを追加してrootStoreに統合
// 更新: RealTimeSliceを追加してrootStoreに統合
// 更新: ChartDataSliceを追加してrootStoreに統合
// 更新: SymbolSliceを追加してrootStoreに統合
// 更新: プロパティ名変更と型互換性問題を解決
// 更新: 2025-05-10 - SocketSliceを追加してrootStoreに統合
// 更新: 2025-05-15 - DebugSliceを統合
// 更新: 2025-05-15 - アクション名重複を解決
// 更新: 2025-05-30 - DataFetchSliceを統合
// 更新: 2025-06-X - SettingsSliceを統合
// 更新: 2025-06-XX - T-7.5フェーズ - ジェネリック型を追加し、unknown型問題を解決

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { logger as loggerFn } from '@/utils/common'
import { ChartSlice, createChartSlice } from './chart'
import type { ChartSliceState } from './chart/state'
import { EntrySlice, createEntrySlice } from './entry'
import type { EntrySliceState } from './entry/state'
import { ChatSlice, createChatSlice } from './chat'
import type { ChatSliceState } from './chat/state'
import { UISlice, createUISlice } from './ui'
import type { UISliceState } from './ui/state'
import { MarketSlice, createMarketSlice } from './market'
import type { MarketSliceState } from './market/state'
import { createChartConfigSlice, type ChartConfigSlice } from './chart/config'
import type { ChartConfigSliceState } from './chart/config/state'
import { createDrawingToolSlice, type DrawingToolSlice } from './chart/drawingTool'
import type { DrawingToolSliceState } from './chart/drawingTool/state'
import { createIndicatorSlice, type IndicatorSlice } from './chart/indicator'
import type { IndicatorSliceState } from './chart/indicator/state'
import { createRealTimeSlice, type RealTimeSlice } from './chart/realTime'
import type { RealTimeSliceState } from './chart/realTime/state'
import { createChartDataSlice, type ChartDataSlice } from './chart/data'
import type { ChartDataSliceState } from './chart/data/state'
import { createSymbolSlice, type SymbolSlice } from './symbol'
import type { SymbolSliceState } from './symbol/state'
import { createSocketSlice } from './socket'
import type { SocketSlice } from './socket'
import type { SocketSliceState } from './socket/state'
import { createDebugSlice } from './debug'
import type { DebugSlice } from './debug'
import type { DebugSliceState } from './debug/state'
import { createDataFetchSlice, type DataFetchSlice } from './dataFetch'
import type { DataFetchSliceState } from './dataFetch/state'
import { createSettingsSlice, type SettingsSlice } from './settings'
import type { SettingsState } from './settings/types'

// RootStore型定義 - 各スライスの状態を統合
export interface RootState extends 
  ChartSliceState, 
  EntrySliceState, 
  ChatSliceState, 
  UISliceState, 
  MarketSliceState, 
  ChartConfigSliceState, 
  DrawingToolSliceState,
  IndicatorSliceState,
  RealTimeSliceState,
  ChartDataSliceState,
  SymbolSliceState,
  SocketSliceState,
  DebugSliceState,
  DataFetchSliceState,
  SettingsState
{}

// 各スライスで追加されるアクションを型で事前定義
export interface RootActions {
  // SocketSliceActions
  setConnected: SocketSlice['setConnected']
  setSocketId: SocketSlice['setSocketId']
  setSubscription: SocketSlice['setSubscription']
  unsubscribeAll: SocketSlice['unsubscribeAll']
  getWebSocketStatus: SocketSlice['getWebSocketStatus']
  // SymbolSliceActions
  setCurrentSymbol: SymbolSlice['setCurrentSymbol']
  setExchangeType: SymbolSlice['setExchangeType']
  fetchSymbols: SymbolSlice['fetchSymbols']
  setFilterOptions: SymbolSlice['setFilterOptions']
  toggleFavorite: SymbolSlice['toggleFavorite']
  clearFilters: SymbolSlice['clearFilters']
  applyFilters: SymbolSlice['applyFilters']
  getSymbolChangeHistory: SymbolSlice['getSymbolChangeHistory']

  // ChartDataSliceActions
  fetchData: ChartDataSlice['fetchData']
  updateData: ChartDataSlice['updateData']
  updateTimeFrame: ChartDataSlice['updateTimeFrame']
  updateSymbol: ChartDataSlice['updateSymbol']
  updateLastCandle: ChartDataSlice['updateLastCandle']

  // RealTimeSliceActions
  startRealTimeUpdates: RealTimeSlice['startRealTimeUpdates']
  stopRealTimeUpdates: RealTimeSlice['stopRealTimeUpdates']
  toggleRealTimeData: RealTimeSlice['toggleRealTimeData']
  initializeApi: RealTimeSlice['initializeApi']
  
  // IndicatorSliceActions
  toggleIndicator: IndicatorSlice['toggleIndicator']
  updateIndicatorParams: IndicatorSlice['updateIndicatorParams']
  clearAllIndicators: IndicatorSlice['clearAllIndicators']
  
  // DrawingToolSliceActions
  toggleDrawingTool: DrawingToolSlice['toggleDrawingTool']
  clearAllDrawingTools: DrawingToolSlice['clearAllDrawingTools']
  
  // ChartConfigSliceActions
  setChartType: ChartConfigSlice['setChartType']
  // setExchangeType: ChartConfigSlice['setExchangeType'] // 名前衝突のためコメントアウト
  
  // ChartSliceActions
  setTimeframe: ChartSlice['setTimeframe']
  refreshOhlcData: ChartSlice['refreshOhlcData']
  
  // EntrySliceActions
  setPendingEntry: EntrySlice['setPendingEntry']
  executeEntry: EntrySlice['executeEntry']
  closePosition: EntrySlice['closePosition']
  cancelPosition: EntrySlice['cancelPosition']
  
  // ChatSliceActions
  setMessages: ChatSlice['setMessages']
  addMessage: ChatSlice['addMessage']
  setIsSearching: ChatSlice['setIsSearching']
  setInput: ChatSlice['setInput']
  sendMessage: ChatSlice['sendMessage']
  clearMessages: ChatSlice['clearMessages']
  updateMessage: ChatSlice['updateMessage']
  deleteMessage: ChatSlice['deleteMessage']
  handleEntryPointQuery: ChatSlice['handleEntryPointQuery']
  handleNewsQuery: ChatSlice['handleNewsQuery']
  handleAIProposalQuery: ChatSlice['handleAIProposalQuery']
  
  // UISliceActions
  setActiveTab: UISlice['setActiveTab']
  toggleDarkMode: UISlice['toggleDarkMode']
  setDarkMode: UISlice['setDarkMode']
  toggleSidebar: UISlice['toggleSidebar']
  setSidebarOpen: UISlice['setSidebarOpen']
  toggleSettings: UISlice['toggleSettings']
  setSettingsOpen: UISlice['setSettingsOpen']
  openModal: UISlice['openModal']
  closeModal: UISlice['closeModal']
  
  // MarketSliceActions
  // setCurrentSymbol: MarketSlice['setCurrentSymbol'] // SymbolSliceに移行
  // setExchangeType: MarketSlice['setExchangeType'] // ChartConfigSliceに移行
  fetchOrderBook: MarketSlice['fetchOrderBook']
  fetchTrades: MarketSlice['fetchTrades']
  fetchMarketStats: MarketSlice['fetchMarketStats']
  // fetchSymbols: MarketSlice['fetchSymbols'] // SymbolSliceに移行
  startPolling: MarketSlice['startPolling']
  stopPolling: MarketSlice['stopPolling']
  setPollingInterval: MarketSlice['setPollingInterval']
  setDemoMode: MarketSlice['setDemoMode']
  
  // DebugSliceActions
  toggleDebugMode: DebugSlice['toggleDebugMode']
  getActiveFetchesInfo: DebugSlice['getActiveFetchesInfo']
  getPollingStatus: DebugSlice['getPollingStatus']
  getDebugSymbolChangeHistory: DebugSlice['getDebugSymbolChangeHistory']
  getDebugWebSocketStatus: DebugSlice['getDebugWebSocketStatus']
  
  // DataFetchSliceActions
  cancelFetch: DataFetchSlice['cancelFetch']
  cancelAllFetches: DataFetchSlice['cancelAllFetches']
  addFetch: DataFetchSlice['addFetch']
  removeFetch: DataFetchSlice['removeFetch']
  
  // SettingsSliceActions
  fetchUserSettings: SettingsSlice['fetchUserSettings']
  fetchChartSettings: SettingsSlice['fetchChartSettings']
  fetchSymbolSettings: SettingsSlice['fetchSymbolSettings']
  updateUserSettings: SettingsSlice['updateUserSettings']
  updateChartSettings: SettingsSlice['updateChartSettings']
  updateSymbolSettings: SettingsSlice['updateSymbolSettings']
  createSymbolSettings: SettingsSlice['createSymbolSettings']
  createChartSettings: SettingsSlice['createChartSettings']
}

// 完全なストア型
export type RootStore = RootState & RootActions

// TypeScriptの型循環参照エラーを回避するための型アサーション
type StateCreator<T> = (
  set: (partial: ((draft: T) => void) | Partial<T>) => void,
  get: () => T
) => T;

// Zustandミドルウェア用のロガー関数
const storeLogger = (storeName: string) => (
  config: any
) => (set: any, get: any, api: any) => {
  const wrappedSet = (args: any) => {
    loggerFn.info(`[${storeName}] state updating`, {
      component: storeName,
      action: 'set'
    });
    return set(args);
  };
  return config(wrappedSet, get, api);
};

// ルートストアの作成 - 明示的なジェネリック型パラメータを指定
export const useRootStore = create<RootStore>()(
  storeLogger('root')(
    devtools(
      persist(
        immer((set, get, api) => {
          // スライスの作成結果を変数に入れて型安全性を確保
          const dataFetchSlice = createDataFetchSlice(
            (fn) => set(fn),
            get as () => DataFetchSliceState & Record<string, unknown>,
            api
          ) as DataFetchSlice;
          
          const socketSlice = createSocketSlice(
            set as any, 
            get as () => SocketSliceState, 
            {} as any
          ) as SocketSlice;
          
          const symbolSlice = createSymbolSlice(
            set as any,
            get as () => SymbolSliceState
          ) as SymbolSlice;

          const chartDataSlice = createChartDataSlice(
            (fn) => set(fn),
            get as () => ChartDataSlice
          ) as ChartDataSlice;

          const realTimeSlice = createRealTimeSlice(
            (fn) => set(fn),
            get as () => RealTimeSlice
          ) as RealTimeSlice;
          
          const indicatorSlice = createIndicatorSlice(
            (fn) => set(fn),
            get as () => IndicatorSlice
          ) as IndicatorSlice;
          
          const drawingToolSlice = createDrawingToolSlice(
            (fn) => set(fn),
            get as () => DrawingToolSlice
          ) as DrawingToolSlice;
          
          const chartConfigSlice = createChartConfigSlice(
            (fn) => set(fn),
            get as () => ChartConfigSlice
          ) as ChartConfigSlice;
          
          const chartSlice = createChartSlice(
            (fn) => set(fn),
            () => ({
              timeframe: get().timeframe,
              ohlcData: get().ohlcData
            } as ChartSliceState)
          ) as ChartSlice;
          
          const entrySlice = createEntrySlice(
            (fn) => set(fn),
            () => ({
              entries: get().entries,
              pendingEntry: get().pendingEntry
            } as EntrySliceState)
          ) as EntrySlice;
          
          const chatSlice = createChatSlice(
            (fn) => set(fn),
            () => ({
              messages: get().messages,
              isSearching: get().isSearching,
              input: get().input
            } as ChatSliceState)
          ) as ChatSlice;
          
          const uiSlice = createUISlice(
            (fn) => set(fn),
            () => ({
              activeTab: get().activeTab,
              isDarkMode: get().isDarkMode,
              isSidebarOpen: get().isSidebarOpen,
              isSettingsOpen: get().isSettingsOpen,
              isModalOpen: get().isModalOpen,
              modalType: get().modalType,
              modalData: get().modalData
            } as UISliceState)
          ) as UISlice;
          
          const marketSlice = createMarketSlice(
            (fn) => set(fn),
            () => ({
              currentSymbol: get().currentSymbol,
              exchangeType: get().exchangeType,
              orderBook: get().orderBook,
              isLoadingOrderBook: get().isLoadingOrderBook,
              orderBookError: get().orderBookError,
              trades: get().trades,
              isLoadingTrades: get().isLoadingTrades,
              tradesError: get().tradesError,
              marketStats: get().marketStats,
              isLoadingMarketStats: get().isLoadingMarketStats,
              marketStatsError: get().marketStatsError,
              symbols: get().symbols,
              isLoadingSymbols: get().isLoadingSymbols,
              symbolsError: get().symbolsError,
              pollingInfo: get().pollingInfo,
              isPolling: get().isPolling,
              pollingInterval: get().pollingInterval,
              isDemoMode: get().isDemoMode
            } as MarketSliceState)
          ) as MarketSlice;
          
          const debugSlice = createDebugSlice(
            (fn) => set(fn),
            () => ({
              isDebugMode: get().isDebugMode
            } as DebugSliceState)
          ) as DebugSlice;
          
          const settingsSlice = createSettingsSlice(
            (fn) => set(fn),
            () => ({
              userSettings: get().userSettings,
              chartSettings: get().chartSettings,
              symbolSettings: get().symbolSettings,
              isLoading: get().isLoading,
              error: get().error
            } as SettingsState)
          ) as SettingsSlice;

          // すべてのスライスを合成して返す
          return {
            ...dataFetchSlice,
            ...socketSlice,
            ...symbolSlice,
            ...chartDataSlice,
            ...realTimeSlice,
            ...indicatorSlice,
            ...drawingToolSlice,
            ...chartConfigSlice,
            ...chartSlice,
            ...entrySlice,
            ...chatSlice,
            ...uiSlice,
            ...marketSlice,
            ...debugSlice,
            ...settingsSlice
          } as RootStore;
        }),
        {
          name: 'tradechat-root-v2', // パーシスト用のキー
          version: 1,                // スキーマバージョン
        }
      ),
      {
        name: 'TradeChat-RootStore', // devtoolsでの表示名
        enabled: process.env.NODE_ENV === 'development',
      }
    ),
    'root'
  )
)

// 標準的なセレクター型
export type Selector<T> = (state: RootStore) => T 