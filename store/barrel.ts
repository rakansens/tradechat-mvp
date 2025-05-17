// store/barrel.ts
// Chart Slice関連のセレクター一覧をエクスポート
// 他のSliceも今後ここに追加していく
// 更新: SymbolSliceのセレクターを追加
// 更新: 2025-05-30 - 明示的にSymbolSliceの特殊なセレクターをエクスポート
// 更新: 2025-05-30 - DataFetchSliceのセレクターを追加
// 更新: 2025-06-01 - OrderBookStore統合に伴うセレクターを追加
// 更新: 2025-06-01 - セレクターの名前衝突を解決
// 更新: 2025-06-29 - ChatSliceの会話単位セレクターを追加
// 更新: 2025-10-07 - CH-01実装: バレルの重複export排除
// 更新: 2025-10-08 - セレクターの名前衝突を解消、単純ワイルドカードエクスポートに変更
// 更新: 2025-10-13 - S-12: 参照エラーのセレクターを修正

/**
 * このファイルは各スライスからのセレクターを再エクスポートします。
 * CH-01実装のため、シンプルかつ明示的なエクスポート構文を使用します。
 *
 * 注意: 名前衝突の可能性があるため、特定のセレクターが必要な場合は
 * 直接スライスのselectors.tsからインポートすることを推奨します。
 */

// 名前衝突の解決に関する注意事項
/**
 * 注: 複数のスライスから同じ名前のセレクターが存在する場合、
 * 後のimport文が前のものを上書きします。
 * 特定のセレクターを使用する場合は、直接スライスから
 * インポートすることを推奨します。
 *
 * 例:
 * // 非推奨:
 * import { selectCurrentSymbol } from '@/store/barrel';
 *
 * // 推奨:
 * import { selectSymbolCurrentSymbol } from '@/store/symbol/selectors';
 */

// DataFetchSliceのセレクター
export {
  selectActiveFetches,
  selectActiveFetchesInfo,
  selectActiveFetchesByType
} from "./dataFetch/selectors";

// SocketSliceのセレクター
export {
  selectConnected,
  useSocketConnected,
  // useSocketSubscriptionsをセレクターとして直接エクスポートするのは非推奨
  useSocketSubscriptions,
  useSocketSubscription
} from "./socket/selectors";

// ChartDataSliceのセレクター
export {
  selectChartData,
  selectError,
  selectCurrentSymbol,
  selectCurrentTimeFrame,
  selectIsLoading as selectIsChartDataLoading,
  selectLatestCandle,
  selectCurrentPrice as selectChartCurrentPrice
} from "./chart/data/selectors";

// ChartConfigSliceのセレクター
export {
  selectChartType,
  selectExchangeType,
  selectIsCandleChart
} from "./chart/config/selectors";
// RootStore版のセレクター
export {
  selectChartTypeFromRoot,
  selectExchangeTypeFromRoot
} from "./chart/config/rootSelectors";

// RealTimeSliceのセレクター
export {
  selectUseRealTimeData,
  selectBitgetApi,
  selectIsWebSocketEnabled,
  selectLastSubscriptionKey
} from "./chart/realTime/selectors";

// DrawingToolSliceのセレクター
export {
  selectActiveDrawingTool,
  selectIsToolActive
} from "./chart/drawingTool/selectors";

// IndicatorSliceのセレクター
export {
  selectActiveIndicators,
  selectIsIndicatorActive
} from "./chart/indicator/selectors";

// MarketSliceのセレクター
export {
  selectMarketCurrentSymbol,
  selectTrades,
  selectMarketStats,
  selectSymbols as selectMarketSymbols,
  selectIsDemoMode,
  select24hVolume,
  select24hPriceChangePercent,

  // OrderBook関連のセレクター
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

// SymbolSliceのセレクター
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

// ChartSliceのセレクター
export {
  selectTimeframe,
  selectOHLCData,
  selectCurrentPrice,
  selectPriceChangePercent
} from './chart/selectors';

// EntrySliceのセレクター
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
} from './entry/selectors';

// ChatSliceのセレクター
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
} from './chat/selectors';

// UISliceのセレクター
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
} from './ui/selectors';
