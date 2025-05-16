// types/index.ts
// 更新: T-6フェーズ - 循環依存解消、共通型の参照先を統一
// 更新: T-7フェーズ - 依存関係を一方向（common → domain → store）に整理
// 更新: T-7.1フェーズ - storeの再エクスポートを削除して循環依存を完全に解消

// アプリケーション全体で使用される型定義をエクスポート
// エクスポート順序は依存関係に基づいています（循環依存を防ぐため）

// まず共通モジュールをエクスポート（基本的な型定義）
export * from './common';  // 基本的な共通型を最初にエクスポート

// 次にドメイン固有の型をエクスポート（ドメイン間の依存関係に注意）
export * from './network'; // APIとネットワーク型をエクスポート
export * from './chart';   // チャート関連の型をエクスポート
export * from './ui';      // UI関連の型をエクスポート
export * from './indicators'; // インジケーター関連の型をエクスポート
export * from './chat';    // チャット関連の型をエクスポート
export * from './entry';   // エントリー関連の型をエクスポート
export * from './symbol';  // シンボル関連の型をエクスポート

/**
 * ストア関連の型定義は直接ストアディレクトリからインポートしてください
 * @note T-7.1フェーズでエクスポートを削除しました
 * @example import { AppState } from '@/types/store/app';
 * @example import { UIState } from '@/types/store/ui';
 * @example import { ChartDataState } from '@/types/store/chart';
 */

// 後方互換性のための非推奨ファイルからのエクスポート（T-7で削除予定）
export * from './common-interfaces'; // @deprecated

// Supabase Database型のエクスポート
export type { Database } from './supabase';

/**
 * @deprecated 将来的なバージョンでは、これらの型は特定のドメインディレクトリからインポートする必要があります。
 * 例: import { SymbolInfo } from '@/types/common/symbol';
 * このexport typeブロックはT-8フェーズで削除される予定です。
 */
// chart.tsの一部の型を後方互換性のためにエクスポート
export type {
  Nominal, UTCTimestamp, BusinessDay, Time, ChartTimeCompatible, 
  OHLCData, ChartState
} from './chart';
