// store/index.ts
// 更新: 新しく分割されたストアをエクスポートするように更新
// 更新: TypeScriptエラーを修正
// 更新: 2025-05-15 - useDebugStoreの参照を削除
// 更新: 2025-05-15 - エクスポート衝突を解消

// 汎用ストア
export { useRootStore } from './rootStore';

// セレクターの直接エクスポートを削除し、個別にインポートするように変更
// export * from './selectors';  

// コアストア
export { default as useDataFetchStore } from './useDataFetchStore';

// 各スライスのエクスポート
export * from './chart';
export * from './chat';
export * from './entry';
export * from './ui';

// エクスポート衝突を避けるために個別スライスのエクスポートは行わず、
// 必要なものを個別にインポートするように変更
// export * from './market';
// export * from './symbol';
// export * from './socket';
// export * from './debug';

// 各スライスの基本エクスポート（内部で衝突しないもののみ）
export { createMarketSlice } from './market';
export { createSymbolSlice } from './symbol';
export { createSocketSlice } from './socket';
export { createDebugSlice } from './debug';

// slice以外の関連ストア
export { useOrderBookStore } from './market/useOrderBookStore';

// 以下の古いストアはDeprecatedとして残しておく
// 新しいスライスを使用するように移行してください。

/**
 * @deprecated このストアは非推奨です。代わりにSymbolSliceを使用してください。
 * import { useRootStore } from '@/store';
 * import { selectCurrentSymbol } from '@/store/symbol/selectors';
 */
// export { default as useSymbolStore } from './useSymbolStore'; - 削除済み

/**
 * @deprecated このストアは非推奨です。代わりにChatSliceを使用してください。
 * import { useRootStore } from '@/store';
 * import { selectMessages } from '@/store/chat/selectors';
 */
// export { default as useChatStore } from './useChatStore'; - 削除済み

/**
 * @deprecated このストアは非推奨です。代わりにUISliceを使用してください。
 * import { useRootStore } from '@/store';
 * import { selectIsDarkMode } from '@/store/ui/selectors';
 */
// export { default as useUIStore } from './useUIStore'; - 削除済み

/**
 * @deprecated このストアは非推奨です。代わりにSocketSliceを使用してください。
 * import { useRootStore } from '@/store';
 * import { useSocketConnected } from '@/store/socket/selectors';
 */
// export { default as useWebSocketStore } from './useWebSocketStore'; - 削除済み

/**
 * @deprecated このストアは非推奨です。代わりにDebugSliceを使用してください。
 * import { useRootStore } from '@/store';
 * import { selectIsDebugMode } from '@/store/debug/selectors';
 */
// export { default as useDebugStore } from './useDebugStore'; - 削除済み
