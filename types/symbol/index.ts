/**
 * シンボル関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルは銘柄情報と関連機能の型定義をエクスポートします。
 * リファクタリングにより、型定義が適切なファイルに分割されました。
 */

// 共通の型定義から主要な型をエクスポート
export type {
  SymbolInfo,
  SymbolDetail,
  SymbolChangeValue,
  SymbolChangeHistoryEntry,
  SymbolFilterOptions as CommonSymbolFilterOptions
} from './common';

// ストア関連の型定義から主要な型をエクスポート
export type {
  SymbolState,
  SymbolFilterOptions as StoreSymbolFilterOptions,
  SymbolActions,
  SymbolSlice
} from './store';

// レガシーサポートのための型エクスポート
export type { LegacySymbolInfo, FilterOptions } from './base';