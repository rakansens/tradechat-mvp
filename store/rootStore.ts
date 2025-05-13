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

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { logger } from './core/loggerMiddleware'
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
import { createSocketSlice, type SocketSlice } from './socket'
import type { SocketSliceState } from './socket/state'

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
  SocketSliceState
{}

// 各スライスで追加されるアクションを型で事前定義
export interface RootActions {
  // SocketSliceActions
  setConnected: SocketSlice['setConnected']
  setSocketId: SocketSlice['setSocketId']
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
}

// 完全なストア型
export type RootStore = RootState & RootActions

// TypeScriptの型循環参照エラーを回避するための型アサーション
type StateCreator<T> = (
  set: (partial: ((draft: T) => void) | Partial<T>) => void,
  get: () => T
) => T;

// ルートストアの作成
export const useRootStore = create<RootStore>()(
  logger(
    devtools(
      persist(
        immer((set, get) => ({
          // SocketSliceを統合
          ...createSocketSlice(
            set as any, 
            get as any, 
            {} as any
          ),
          
          // SymbolSliceを統合
          ...createSymbolSlice(
            set as any,
            get as any
          ),

          // ChartDataSliceを統合
          ...createChartDataSlice(
            (fn) => set(fn),
            get
          ),

          // RealTimeSliceを統合
          ...createRealTimeSlice(
            (fn) => set(fn),
            get
          ),
          
          // IndicatorSliceを統合
          ...createIndicatorSlice(
            (fn) => set(fn),
            get
          ),
          
          // DrawingToolスライスを統合
          ...createDrawingToolSlice(
            (fn) => set(fn),
            get
          ),
          
          // ChartConfigスライスを統合
          ...createChartConfigSlice(
            (fn) => set(fn),
            get
          ),
          
          // チャートスライスを統合
          ...createChartSlice(
            (fn) => set(fn),
            () => ({
              timeframe: get().timeframe,
              // chartType: get().chartType, // ChartConfigSliceに移行
              ohlcData: get().ohlcData
            } as ChartSliceState)
          ),
          
          // エントリースライスを統合
          ...createEntrySlice(
            (fn) => set(fn),
            () => ({
              entries: get().entries,
              pendingEntry: get().pendingEntry
            } as EntrySliceState)
          ),
          
          // チャットスライスを統合
          ...createChatSlice(
            (fn) => set(fn),
            () => ({
              messages: get().messages,
              isSearching: get().isSearching,
              input: get().input
            } as ChatSliceState)
          ),
          
          // UIスライスを統合
          ...createUISlice(
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
          ),
          
          // マーケットスライスを統合
          ...createMarketSlice(
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
          )
        })),
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