// store/index.ts
// 更新: 新しく分割されたストアをエクスポートするように更新
// 更新: ドメイン駆動設計ストア構造に完全移行
// 更新: 全ての機能領域ごとに専用ストアを作成
// 更新: 全てのコンポーネントが新しいドメインストアを使用
// 更新: スライスベースのアーキテクチャに移行
// 更新: 新しいRealTimeSliceをエクスポートに追加
// 更新: 新しいChartDataSliceをエクスポートに追加
// 更新: エクスポートの重複を修正
// 更新: セレクターの競合を解決
// 更新: チャット関連とその他不足しているセレクターを追加

// ルートストアをエクスポート
export { useRootStore } from './rootStore';

// 各ドメイン別ストアをエクスポート

// 新しく分割されたストアをエクスポート
export { default as useSymbolStore } from './useSymbolStore';
export { default as useDataFetchStore } from './useDataFetchStore';
export { default as useWebSocketStore } from './useWebSocketStore';
export { default as useDebugStore } from './useDebugStore';

// 分割されたチャートストアをエクスポート
// @deprecated 以下のエクスポートは非推奨です。代わりにuseRootStoreを使用してください
export { useChartDataStore as useChartDataStoreLegacy } from './chart/useChartDataStore';
export { useChartConfigStore } from './chart/useChartConfigStore';
// @deprecated レガシーになりました。rootStoreに統合された新しいものを使用してください
export { useRealTimeStore as useRealTimeStoreLegacy } from './chart/useRealTimeStore';
export { useIndicatorStore } from './chart/useIndicatorStore';
export { useDrawingToolStore } from './chart/useDrawingToolStore';

// マーケットストアをエクスポート
export { useOrderBookStore } from './market/useOrderBookStore';

// その他のストアをエクスポート
export { useEntryStore } from './useEntryStore';
export { useChatStore } from './useChatStore';

// 従来のストア（非推奨、将来的には削除予定）
export { useUIStore } from './useUIStore';

// 新しいスライスベースの実装
export { createChartDataSlice, type ChartDataSlice, type ChartDataActions } from './chart/data';
export { useChartDataStore as useChartDataStoreNew } from './chart/data';
export { createRealTimeSlice, type RealTimeSlice, type RealTimeActions } from './chart/realTime';
export { useRealTimeStore as useRealTimeStoreNew } from './chart/realTime';

// 重要なセレクターを明示的にエクスポート（競合を避けるため）
// ChartDataSliceのセレクター
export {
  selectChartData,
  selectIsLoading,
  selectError,
  selectCurrentPrice,
  selectLatestCandle,
  selectPriceRange,
  // 以下のセレクターは両方の場所で定義されているので明示的なパスでインポートする必要があります
  // selectCurrentSymbol,
  // selectCurrentTimeFrame,
} from './chart/data/selectors';

// ChartConfigSliceのセレクター
export {
  selectChartType,
  // 以下のセレクターは両方の場所で定義されているので明示的なパスでインポートする必要があります
  // selectExchangeType,
} from './chart/config/selectors';

// UIスライスのセレクター
export {
  selectActiveTab,
  selectIsDarkMode,
  selectIsSidebarOpen,
  selectIsSettingsOpen,
  selectIsModalOpen,
  selectModalType,
  selectModalData,
} from './ui/selectors';

// エントリースライスのセレクター
export {
  selectEntries,
  selectPendingEntry,
  selectHasPendingEntry,
  selectOpenEntries,
  selectClosedEntries,
} from './entry/selectors';

// その他の必要なセレクター
export { selectPriceChangePercent } from './chart/selectors';

// チャット関連のセレクター
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
} from './chat/selectors';

// ドメイン駆動設計ストア構造の参照ガイド:
// - ルートストア: useRootStore（チャート、エントリー、チャット、UIスライスを含む統合ストア）
// - シンボル管理: useSymbolStore
// - チャートデータ: useRootStore + selectChartData などのセレクター
// - オーダーブック: useOrderBookStore
// - WebSocket状態: useWebSocketStore
// - デバッグ機能: useDebugStore
