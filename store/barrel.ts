// store/barrel.ts
// Chart Slice関連のセレクター一覧をエクスポート
// 他のSliceも今後ここに追加していく
// 更新: SymbolSliceのセレクターを追加
// 更新: 2025-05-30 - 明示的にSymbolSliceの特殊なセレクターをエクスポート
// 更新: 2025-05-30 - DataFetchSliceのセレクターを追加
// 更新: 2025-06-01 - OrderBookStore統合に伴うセレクターを追加
// 更新: 2025-06-01 - セレクターの名前衝突を解決
// 更新: 2025-06-29 - ChatSliceの会話単位セレクターを追加

// DataFetchSliceのセレクターを追加
export * from "./dataFetch/selectors"

// SocketSliceのセレクター
export * from "./socket/selectors"

// ChartDataSliceのセレクター
export * from "./chart/data/selectors"

// ChartConfigSliceのセレクターを選択的にエクスポート（名前衝突を回避）
export {
  selectChartType,
  // selectExchangeTypeはシンボルスライスから取得
} from "./chart/config/selectors"

// RealTimeSliceのセレクター
export * from "./chart/realTime/selectors"

// DrawingToolSliceのセレクター
export * from "./chart/drawingTool/selectors"

// IndicatorSliceのセレクター
export * from "./chart/indicator/selectors"

// MarketSliceのセレクターを選択的にエクスポート
export {
  selectMarketCurrentSymbol,
  selectTrades,
  selectMarketStats,
  selectSymbols,
  selectIsDemoMode,
  select24hVolume,
  select24hPriceChangePercent
} from './market/selectors';

// OrderBookStore統合: 明示的にセレクターをエクスポート
export {
  selectOrderBook,
  selectIsLoadingOrderBook,
  selectOrderBookError,
  selectOrderBookWsSubscribed,
  selectOrderBookPollingInfo,
  selectOrderBookPollingActive,
  selectOrderBookLastPollTime,
  selectBids,
  selectAsks,
  selectHighestBid,
  selectLowestAsk,
  selectSpread,
  selectSpreadPercent
} from './market/selectors';

// SymbolSliceのセレクターを明示的にエクスポート
export {
  selectSymbolCurrentSymbol as selectCurrentSymbol,
  selectSymbolExchangeType as selectExchangeType,
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
  // 基本セレクター
  selectMessages,
  selectIsSearching,
  selectInput,
  
  // アクティブ会話セレクター
  selectActiveConversationId,
  selectActiveConversation,
  selectActiveMessages,
  selectActiveInput,
  selectActiveIsSearching,
  selectConversationConnection,
  selectGlobalConnectionStatus,
  
  // メモ化されたセレクター
  selectLastMessage,
  selectActiveLastMessage,
  selectMessageCount,
  selectUserMessages,
  selectAIMessages,
  selectProposalMessages,
  selectLatestProposal,
  selectActiveMessagesWithStreaming,
  selectMessagesWithStreaming,
  selectActiveStreamingMessage,
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