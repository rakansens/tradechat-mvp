// store/selectors.ts
// 更新: 新しく分割されたストアのセレクタをエクスポートするように更新
// 更新: TypeScriptエラーを修正
// 更新: 2025-05-15 - 古いストア参照を削除し、新しいスライスの型を使用
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

// 以下は後方互換性のために残しています
// 型定義をインポート
import { DataFetchState } from './useDataFetchStore';
import type { SymbolSliceState } from './symbol/state';
import type { SocketSliceState } from './socket/state';
import type { DebugSliceState } from './debug/state';

// シンボルストアセレクタ（後方互換性用）
export const selectCurrentSymbol = (state: SymbolSliceState) => state.currentSymbol;
export const selectExchangeType = (state: SymbolSliceState) => state.exchangeType;
export const selectSymbols = (state: SymbolSliceState) => state.symbolsList;
export const selectFilteredSymbols = (state: SymbolSliceState) => state.filteredSymbols;
export const selectFilterOptions = (state: SymbolSliceState) => state.symbolFilterOptions;
export const selectIsLoadingSymbols = (state: SymbolSliceState) => state.isLoadingSymbols;
export const selectSymbolError = (state: SymbolSliceState) => state.symbolError;

// データフェッチストアセレクタ
export const selectActiveFetches = (state: DataFetchState) => state.activeFetches;

// WebSocketストアセレクタ（後方互換性用）
export const selectWsConnected = (state: SocketSliceState) => state.connected;
export const selectWsSubscriptions = (state: SocketSliceState) => state.subscriptions;

// デバッグストアセレクタ（後方互換性用）
export const selectIsDebugMode = (state: DebugSliceState) => state.isDebugMode;
