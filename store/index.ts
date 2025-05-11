// store/index.ts
// 更新: 新しく分割されたストアをエクスポートするように更新
// 更新: useAppStoreを追加し、シンボル管理とデータフェッチを一元化
// 更新: 循環参照を解消し、互換レイヤーを追加
// 更新: 互換レイヤーを完全に削除し、すべてのコンポーネントを新しいAPIに移行
// 更新: 新しく分割されたストア（useSymbolStore, useDataFetchStore, useWebSocketStore, useDebugStore）を追加

// 中心となるAppStoreをエクスポート
export { default as useAppStore } from './useAppStore';

// 新しく分割されたストアをエクスポート
export { default as useSymbolStore } from './useSymbolStore';
export { default as useDataFetchStore } from './useDataFetchStore';
export { default as useWebSocketStore } from './useWebSocketStore';
export { default as useDebugStore } from './useDebugStore';

// 分割されたチャートストアをエクスポート
export {
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore,
  useIndicatorStore,
  useDrawingToolStore
} from './chart';

// マーケットストアをエクスポート
export { useOrderBookStore } from './market/useOrderBookStore';

// その他のストアをエクスポート
export { useEntryStore } from './useEntryStore';
export { useChatStore } from './useChatStore';
export { useUIStore } from './useUIStore';


// 集約されたセレクターをエクスポート
export * from './selectors';

// 全てのストアが新しい構造に移行完了
// 注意: シンボル管理とデータフェッチはuseAppStoreを使用してください
// 互換レイヤーは完全に削除されました
