/**
 * ストア関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはT-2フェーズでtypes/store.tsの型がストアドメイン関連ファイルに
 * 移動されました。
 * T-7フェーズで循環依存を解消するために再構成されました。
 * T-7.1フェーズで循環参照を完全に解消しました。
 * T-7.7フェーズでエクスポート方法を統一し、型参照エラーを解消しました。
 * T-7.7.1フェーズで型エクスポートを修正し、未解決の参照エラーを解消しました。
 * T-7.7.3フェーズで型エクスポートを整理し、型参照問題を解消
 * T-8.0.0フェーズでエクスポート構造を簡素化し、重複を解消
 * T-9.0.0フェーズで不足している型を追加し、エクスポートを統一化
 * CH-01フェーズ (2025-10-07) - バレルの重複export排除と欠損ファイルの追加
 * CH-01フェーズ (2025-10-08) - 相対パスを絶対パスに変更して参照エラーを解消
 * S-3フェーズ (2025-10-08) - settingsモジュールのエクスポートを追加
 * S-12フェーズ (2025-10-12) - 型参照の一元化
 * 
 * 依存方向：common → domain → store（循環参照を防ぐために逆方向の依存は避ける）
 * 
 * ※重要※：ストア型のインポートは必ずこのディレクトリから直接行ってください
 * 良い例: import { AppState } from '@/types/store/app';
 * 悪い例: import { AppState } from '@/types'; // 循環参照の原因になります
 */

// コアストア関連の型
export * from '@/types/store/core';

// ドメイン固有の型をエクスポート
export * from '@/types/store/app';
export * from '@/types/store/chart';
export * from '@/types/store/market';
export * from '@/types/store/ui';
export * from '@/types/store/symbol';
export * from '@/types/store/entry';
export * from '@/types/store/settings';
export * from '@/types/store/socket';
export * from '@/types/store/debug';
export * from '@/types/store/dataFetch';
export * from '@/types/store/chat'; // ConnectionStatusの衝突があるため、最後にエクスポート

// 明示的に不足している型をエクスポート
// chart.tsからのエクスポート
export { 
  type IndicatorType,
  type ActiveIndicator,
  type DrawingToolType,
  type IndicatorConfig,
  type DrawingTool
} from './chart';

// ui.tsからのエクスポート
export { 
  type TabType 
} from './ui';

// シンボル関連の型
export {
  type SymbolChangeHistory,
  type SymbolChangeValue
} from './symbol';

// アプリケーションの状態全体を表す型
export interface StoreState {
  chart: import('@/types/store/chart').ChartDataState & 
         import('@/types/store/chart').ChartConfigState & 
         import('@/types/store/chart').IndicatorState & 
         import('@/types/store/chart').DrawingToolState & 
         import('@/types/store/chart').RealTimeState;
  market: import('@/types/store/market').MarketState;
  ui: import('@/types/store/ui').UIState;
  app: import('@/types/store/app').AppState;
  symbol: import('@/types/store/symbol').SymbolState;
  entry: import('@/types/store/entry').EntryState;
  chat: import('@/types/store/chat').ChatState;
  socket: import('@/types/store/socket').SocketState;
  debug: import('@/types/store/debug').DebugState;
  dataFetch: import('@/types/store/dataFetch').DataFetchState;
}

// 後方互換性のためのコメント
/**
 * 以下の型は各ファイルから直接インポートしてください:
 * - AppState: '@/types/store/app'
 * - UIState, TabType: '@/types/store/ui'
 * - ChartDataState, ChartConfigState, IndicatorState, DrawingToolState, RealTimeState: '@/types/store/chart'
 * - MarketState: '@/types/store/market'
 * - IndicatorType, ActiveIndicator, DrawingToolType, DrawingTool: '@/types/store/chart'
 * - SymbolState, SymbolActions: '@/types/store/symbol'
 * - EntryState, EntryActions: '@/types/store/entry'
 * - ChatState, ChatActions: '@/types/store/chat'
 * - SocketState, SocketActions: '@/types/store/socket'
 * - DebugState, DebugActions: '@/types/store/debug'
 * - DataFetchState, DataFetchActions: '@/types/store/dataFetch'
 */

import type { StateCreator } from 'zustand'

// スライスクリエーター型定義
// これは各スライスが共通で使用する型です
export type SliceCreator<TSlice, TState> = (
  set: (nextStateOrUpdater: ((state: TState) => void) | Partial<TState>) => void,
  get: () => TSlice,
  api?: any
) => TSlice 

// settingsモジュールをエクスポート
export * from '@/types/store/settings';

// StoreFilterOptions は @/types/store から直接インポートしてください
// 例: import { StoreFilterOptions } from '@/types/store';
// この型は循環参照を避けるために、直接インポートする必要があります。