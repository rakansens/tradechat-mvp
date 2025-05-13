// store/barrel.ts
// Chart Slice関連のセレクター一覧をエクスポート
// 他のSliceも今後ここに追加していく

// IndicatorSliceのセレクターをエクスポート
export {
  selectActiveIndicators,
  selectIndicatorParams,
  selectIsIndicatorActive
} from './chart/indicator/selectors'

// DrawingToolスライスのセレクターをエクスポート
export {
  selectActiveDrawingTools,
  selectIsToolActive
} from './chart/drawingTool/selectors'

// ChartConfigスライスのセレクターをエクスポート
export {
  selectChartType,
  selectExchangeType,
  selectIsCandleChart
} from './chart/config/selectors'

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