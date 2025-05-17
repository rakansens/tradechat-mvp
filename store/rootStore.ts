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
// 更新: 2025-10-01 - T-8フェーズ - ジェネリック問題を解消するimmerSetラッパーを追加
// 更新: 2025-10-09 - S-10.1フェーズ: 暗黙的any型を明示的型に修正

import { create, StateCreator, StoreApi, useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { produce, type Draft } from 'immer';
import { devtools } from 'zustand/middleware';
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
import { createChartDataSlice, type ChartDataSlice } from './chart/data'
import type { ChartDataSliceState } from './chart/data/state'
import { createSymbolSlice, type SymbolSlice } from './symbol'
import type { SymbolState } from '@/types/symbol/store';
import type { ExchangeType, ProductType } from '@/types/constants/enums';
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
  Omit<ChartSliceState, 'chartType'>, // chartType を除外
  EntrySliceState,
  ChatSliceState,
  UISliceState,
  MarketSliceState,
  ChartConfigSliceState, // chartType を含む
  DrawingToolSliceState,
  IndicatorSliceState,
  RealTimeSliceState,
  ChartDataSliceState,
  Omit<SymbolSliceState, 'exchangeType'>, // exchangeType を除外
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
  // 2025-05-17: ProductType対応の新しいメソッドを追加
  setProductType: SymbolSlice['setProductType']
  // 後方互換性のために古いメソッドも保持
  // 更新: 2025-05-17 - ExchangeTypeとProductTypeの両方をサポートするように型定義を拡張
  setExchangeType: (type: ExchangeType | ProductType) => void
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
  addIndicator: IndicatorSlice['addIndicator']
  removeIndicator: IndicatorSlice['removeIndicator']
  updateIndicatorSettings: IndicatorSlice['updateIndicatorSettings']
  
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
  config: (set: any, get: any, api: any) => any
) => (
  set: (state: any) => void, 
  get: () => any, 
  api: StoreApi<any>
) => {
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
          // immerSetラッパー - ジェネリックな型パラメータを持つヘルパー関数
          const immerSet = <TState>(fn: (draft: Draft<TState>) => void) => {
            return set((state: RootState) =>
              produce(state, draft => {
                fn(draft as Draft<TState>);
              })
            );
          };

          // 型安全なGetState関数
          const getState = <TState>() => get() as TState;

          // スライスの作成 - 全て同じパターンを使用
          const dataFetchSlice = createDataFetchSlice(
            (fn) => immerSet<DataFetchSliceState>(fn),
            () => getState<DataFetchSliceState>(),
            api
          );
          
          const socketSlice = createSocketSlice(
            (fn) => immerSet<SocketSliceState>(fn),
            () => getState<SocketSliceState>(),
            api
          );
          
          const symbolSlice = createSymbolSlice(
            (fn) => immerSet<SymbolState>(fn),
            () => getState<SymbolSlice>()
          );

          const chartDataSlice = createChartDataSlice(
            (fn) => immerSet<ChartDataSliceState>(fn),
            () => getState<ChartDataSlice>()
          );

          const realTimeSlice = createRealTimeSlice(
            (fn) => immerSet<RealTimeSliceState>(fn),
            () => getState<RealTimeSlice>()
          );
          
          const indicatorSlice = createIndicatorSlice(
            (fn) => immerSet<IndicatorSliceState>(fn),
            () => getState<IndicatorSlice>()
          );
          
          const drawingToolSlice = createDrawingToolSlice(
            (fn) => immerSet<DrawingToolSliceState>(fn),
            () => getState<DrawingToolSlice>()
          );
          
          const chartConfigSlice = createChartConfigSlice(
            (fn) => immerSet<ChartConfigSliceState>(fn),
            () => getState<ChartConfigSlice>()
          );
          
          const chartSlice = createChartSlice(
            (fn) => immerSet<ChartSliceState>(fn),
            () => getState<ChartSliceState>()
          );
          
          const entrySlice = createEntrySlice(
            (fn) => immerSet<EntrySliceState>(fn),
            () => getState<EntrySliceState>()
          );
          
          const chatSlice = createChatSlice(
            (fn) => immerSet<ChatSliceState>(fn),
            () => getState<ChatSliceState>(),
            api
          );
          
          const uiSlice = createUISlice(
            (fn) => immerSet<UISliceState>(fn),
            () => getState<UISliceState>()
          );
          
          const marketSlice = createMarketSlice(
            (fn) => immerSet<MarketSliceState>(fn),
            () => getState<MarketSliceState>()
          );
          
          const debugSlice = createDebugSlice(
            (fn) => immerSet<DebugSliceState>(fn),
            () => getState<DebugSliceState>()
          );
          
          const settingsSlice = createSettingsSlice(
            (fn) => immerSet<SettingsState>(fn),
            () => getState<SettingsState>()
          );

          // すべてのスライスを合成して返す
          const combined: RootStore = {
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
          };
          return combined;
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
    )
  )
)

// 標準的なセレクター型
export type Selector<T> = (state: RootStore) => T 