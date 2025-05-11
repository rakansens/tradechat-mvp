// store/selectors.ts
// 更新: 新しく分割されたストアのセレクタをエクスポートするように更新
// 更新: TypeScriptエラーを修正
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

// 新しく分割されたストアのセレクタ
// 型定義をインポート
import { SymbolState } from './useSymbolStore';
import { DataFetchState } from './useDataFetchStore';
import { WebSocketState } from './useWebSocketStore';
import { DebugState } from './useDebugStore';

// シンボルストアセレクタ
export const selectCurrentSymbol = (state: SymbolState) => state.currentSymbol;
export const selectExchangeType = (state: SymbolState) => state.exchangeType;
export const selectSymbols = (state: SymbolState) => state.symbols;
export const selectFilteredSymbols = (state: SymbolState) => state.filteredSymbols;
export const selectFilterOptions = (state: SymbolState) => state.filterOptions;
export const selectIsLoadingSymbols = (state: SymbolState) => state.isLoadingSymbols;
export const selectSymbolError = (state: SymbolState) => state.symbolError;

// データフェッチストアセレクタ
export const selectActiveFetches = (state: DataFetchState) => state.activeFetches;

// WebSocketストアセレクタ
export const selectWsConnected = (state: WebSocketState) => state.wsConnected;
export const selectWsSubscriptions = (state: WebSocketState) => state.wsSubscriptions;

// デバッグストアセレクタ
export const selectIsDebugMode = (state: DebugState) => state.isDebugMode;
