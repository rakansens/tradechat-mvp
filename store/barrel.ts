// store/barrel.ts
// Chart Slice関連のセレクター一覧をエクスポート
// 他のSliceも今後ここに追加していく
// 更新: SymbolSliceのセレクターを追加
// 更新: 2025-05-30 - 明示的にSymbolSliceの特殊なセレクターをエクスポート

// SocketSliceのセレクター
export * from "./socket/selectors"

// ChartDataSliceのセレクター
export * from "./chart/data/selectors"

// ChartConfigSliceのセレクター
export * from "./chart/config/selectors"

// RealTimeSliceのセレクター
export * from "./chart/realTime/selectors"

// DrawingToolSliceのセレクター
export * from "./chart/drawingTool/selectors"

// IndicatorSliceのセレクター
export * from "./chart/indicator/selectors"

// SymbolSliceのセレクター
export * from "./symbol/selectors"

// 特定のSymbolSliceセレクターを明示的にエクスポート（名前衝突防止のため）
export {
  selectSymbolCurrentSymbol,
  selectSymbolExchangeType,
  selectSymbolList,
  selectFilteredSymbols,
  selectSymbolFilterOptions,
  selectIsLoadingSymbols,
  selectSymbolError,
  selectSymbolChangeHistory,
  selectFavoriteSymbols,
  selectQuoteAssets
} from './symbol/selectors';

// Chart Sliceのセレクターをエクスポート
export {
  selectTimeframe,
  // selectChartType, // ChartConfigSliceに移行
  selectOHLCData,
  selectCurrentPrice,
  selectPriceChangePercent
} from './chart/selectors'

// Entry Sliceのセレクターをエクスポート
export {
  selectEntries,
  selectPendingEntry,
  selectHasPendingEntry,
  selectOpenEntries,
  selectClosedEntries,
  selectCanceledEntries,
  selectLatestEntry,
  selectProfitableEntries,
  selectLossEntries,
  selectTotalProfit
} from './entry/selectors'

// Chat Sliceのセレクターをエクスポート
export {
  selectMessages,
  selectIsSearching,
  selectInput,
  selectLastMessage,
  selectMessageCount,
  selectUserMessages,
  selectAIMessages,
  selectProposalMessages,
  selectLatestProposal,
  selectMessagesWithStreaming,
  selectStreamingMessage
} from './chat/selectors'

// UI Sliceのセレクターをエクスポート
export {
  selectActiveTab,
  selectIsDarkMode,
  selectIsSidebarOpen,
  selectIsSettingsOpen,
  selectIsModalOpen,
  selectModalType,
  selectModalData,
  selectIsChartTabActive,
  selectIsOrderbookTabActive,
  selectIsTradesTabActive,
  selectIsPositionsTabActive,
  selectIsSettingsTabActive,
  selectThemeClass,
  selectLayoutClass,
  selectHasModal,
  selectModalProps
} from './ui/selectors'

// Market Sliceのセレクターをエクスポート
export {
  selectMarketCurrentSymbol,
  // selectExchangeType, // ChartConfigSliceに移行
  selectOrderBook,
  selectIsLoadingOrderBook,
  selectOrderBookError,
  selectTrades,
  selectMarketStats,
  selectSymbols,
  selectIsDemoMode,
  selectBids,
  selectAsks,
  selectHighestBid,
  selectLowestAsk,
  selectSpread,
  selectSpreadPercent,
  select24hVolume,
  select24hPriceChangePercent
} from './market/selectors' 