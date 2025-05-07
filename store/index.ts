// store/index.ts
// 更新: アプリストアを追加、分割されたストアとセレクターをエクスポートするように更新
// 更新: useAppStoreを追加し、シンボル管理とデータフェッチを一元化
// 更新: 循環参照を解消し、互換レイヤーを追加
// 更新: 互換レイヤーを完全に削除し、すべてのコンポーネントを新しいAPIに移行

// 中心となるAppStoreをエクスポート
export { default as useAppStore } from './useAppStore';

// 分割されたチャートストアをエクスポート
export {
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore,
  useIndicatorStore,
  useDrawingToolStore
} from './chart';

// その他のストアをエクスポート
export { useEntryStore } from './useEntryStore';
export { useChatStore } from './useChatStore';
export { useUIStore } from './useUIStore';


// 集約されたセレクターをエクスポート
export * from './selectors';

// 全てのストアが新しい構造に移行完了
// 注意: シンボル管理とデータフェッチはuseAppStoreを使用してください
// 互換レイヤーは完全に削除されました
