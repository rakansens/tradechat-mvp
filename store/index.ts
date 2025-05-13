// store/index.ts
// 更新: 新しく分割されたストアをエクスポートするように更新
// 更新: ドメイン駆動設計ストア構造に完全移行
// 更新: 全ての機能領域ごとに専用ストアを作成
// 更新: 全てのコンポーネントが新しいドメインストアを使用
// 更新: スライスベースのアーキテクチャに移行

// ルートストアをエクスポート
export { useRootStore } from './rootStore';

// 各ドメイン別ストアをエクスポート

// 新しく分割されたストアをエクスポート
export { default as useSymbolStore } from './useSymbolStore';
export { default as useDataFetchStore } from './useDataFetchStore';
export { default as useWebSocketStore } from './useWebSocketStore';
export { default as useDebugStore } from './useDebugStore';

// 分割されたチャートストアをエクスポート
export { useChartDataStore } from './chart/useChartDataStore';
export { useChartConfigStore } from './chart/useChartConfigStore';
export { useRealTimeStore } from './chart/useRealTimeStore';
export { useIndicatorStore } from './chart/useIndicatorStore';
export { useDrawingToolStore } from './chart/useDrawingToolStore';

// マーケットストアをエクスポート
export { useOrderBookStore } from './market/useOrderBookStore';

// その他のストアをエクスポート
export { useEntryStore } from './useEntryStore';
export { useChatStore } from './useChatStore';

// 従来のストア（非推奨、将来的には削除予定）
export { useUIStore } from './useUIStore';

// 集約されたセレクターをエクスポート
export * from './selectors';
export * from './barrel';

// ドメイン駆動設計ストア構造の参照ガイド:
// - ルートストア: useRootStore（チャート、エントリー、チャット、UIスライスを含む統合ストア）
// - シンボル管理: useSymbolStore
// - チャートデータ: useChartDataStore
// - オーダーブック: useOrderBookStore
// - WebSocket状態: useWebSocketStore
// - デバッグ機能: useDebugStore
