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
// 更新: 2025-06-30 - T-7.8フェーズ - 型安全なSlice定義とプロパティアクセスを実装

import { create, type StoreApi } from 'zustand'
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
          // 型付きset/get関数を定義
          // 型安全なSetState関数
          const typedSet = <T>(fn: (state: T) => void) => 
            set((state) => {
              fn(state as unknown as T);
              return state;
            });
          
          // 型安全なGetState関数
          const typedGet = <T>() => get() as unknown as T;
          
          // スライスの作成結果を変数に入れて型安全性を確保
          const dataFetchSlice = createDataFetchSlice(
            set as StoreApi<DataFetchSlice>['setState'],
            get as StoreApi<DataFetchSlice>['getState'],
            api as unknown as StoreApi<DataFetchSlice>
          );
          
          const socketSlice = createSocketSlice(
            set as StoreApi<SocketSlice>['setState'],
            get as StoreApi<SocketSlice>['getState'],
            api as unknown as StoreApi<SocketSlice>
          );
          
          const symbolSlice = createSymbolSlice(
            set as StoreApi<SymbolSlice>['setState'],
            get as StoreApi<SymbolSlice>['getState']
          );

          const chartDataSlice = createChartDataSlice(
            set as StoreApi<ChartDataSlice>['setState'],
            get as StoreApi<ChartDataSlice>['getState']
          );

          const realTimeSlice = createRealTimeSlice(
            set as StoreApi<RealTimeSlice>['setState'],
            get as StoreApi<RealTimeSlice>['getState']
          );
          
          const indicatorSlice = createIndicatorSlice(
            set as StoreApi<IndicatorSlice>['setState'],
            get as StoreApi<IndicatorSlice>['getState']
          );
          
          const drawingToolSlice = createDrawingToolSlice(
            set as StoreApi<DrawingToolSlice>['setState'],
            get as StoreApi<DrawingToolSlice>['getState']
          );
          
          const chartConfigSlice = createChartConfigSlice(
            set as StoreApi<ChartConfigSlice>['setState'],
            get as StoreApi<ChartConfigSlice>['getState']
          );
          
          const chartSlice = createChartSlice(
            set as StoreApi<ChartSlice>['setState'],
            get as StoreApi<ChartSlice>['getState']
          );
          
          const entrySlice = createEntrySlice(
            set as StoreApi<EntrySlice>['setState'],
            get as StoreApi<EntrySlice>['getState']
          );
          
          const chatSlice = createChatSlice(
            set as StoreApi<ChatSlice>['setState'],
            get as StoreApi<ChatSlice>['getState']
          );
          
          const uiSlice = createUISlice(
            set as StoreApi<UISlice>['setState'],
            get as StoreApi<UISlice>['getState']
          );
          
          const marketSlice = createMarketSlice(
            set as StoreApi<MarketSlice>['setState'],
            get as StoreApi<MarketSlice>['getState']
          );
          
          const debugSlice = createDebugSlice(
            set as StoreApi<DebugSlice>['setState'],
            get as StoreApi<DebugSlice>['getState']
          );
          
          const settingsSlice = createSettingsSlice(
            set as StoreApi<SettingsSlice>['setState'],
            get as StoreApi<SettingsSlice>['getState']
          );

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