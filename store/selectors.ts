// store/selectors.ts
// 更新: 新しく分割されたストアのセレクタをエクスポートするように更新
// 更新: TypeScriptエラーを修正
// 更新: 2025-05-15 - 古いストア参照を削除し、新しいスライスの型を使用
// 更新: 2025-05-30 - DataFetchStateのインポートを削除し、新しいDataFetchSliceを使用
// 
// このファイルは各ストアのセレクタをまとめてエクスポートし、
// アプリケーション全体で一貫したインポートパスを提供します。

// UIストアセレクタ
export * from './ui/selectors';

// チャートストアセレクタ
export * from './chart/selectors';

// マーケットストアセレクタ
export * from './market/selectors';

// エントリーストアセレクタ
export * from './entry/selectors';

// チャットストアセレクタ
export * from './chat/selectors';

// シンボルスライスセレクタ
export * from './symbol/selectors';

// ソケットスライスセレクタ
export * from './socket/selectors';

// デバッグスライスセレクタ
export * from './debug/selectors';

// DataFetchスライスセレクタ
export * from './dataFetch/selectors';

// 以下は後方互換性のために残しています
// 型定義をインポート
import type { SymbolSliceState } from './symbol/state';
import type { SocketSliceState } from './socket/state';
import type { DebugSliceState } from './debug/state';
import type { DataFetchSliceState } from './dataFetch/state';

// シンボルストアセレクタ（後方互換性用）
export const selectCurrentSymbol = (state: SymbolSliceState) => state.currentSymbol;
export const selectExchangeType = (state: SymbolSliceState) => state.exchangeType;
export const selectSymbols = (state: SymbolSliceState) => state.symbolsList;
export const selectFilteredSymbols = (state: SymbolSliceState) => state.filteredSymbols;
export const selectFilterOptions = (state: SymbolSliceState) => state.filterOptions;
export const selectIsLoadingSymbols = (state: SymbolSliceState) => state.isLoading;
export const selectSymbolError = (state: SymbolSliceState) => state.error;

// データフェッチストアセレクタ（後方互換性用）
export const selectActiveFetches = (state: DataFetchSliceState) => state.activeFetches;

// WebSocketストアセレクタ（後方互換性用）
export const selectWsConnected = (state: SocketSliceState) => state.connected;
export const selectWsSubscriptions = (state: SocketSliceState) => state.subscriptions;

// デバッグストアセレクタ（後方互換性用）
export const selectIsDebugMode = (state: DebugSliceState) => state.isDebugMode;
