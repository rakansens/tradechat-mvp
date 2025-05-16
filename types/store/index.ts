/**
 * ストア関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはT-2フェーズでtypes/store.tsの型がストアドメイン関連ファイルに
 * 移動されました。
 * T-7フェーズで循環依存を解消するために再構成されました。
 * T-7.1フェーズで循環参照を完全に解消しました。
 * T-7.7フェーズでエクスポート方法を統一し、型参照エラーを解消しました。
 * T-7.7.1フェーズで型エクスポートを修正し、未解決の参照エラーを解消しました。
 * T-7.7.3フェーズで次の型を正式にエクスポート: IndicatorType, ActiveIndicator, DrawingToolType, TabType
 * T-7.7.4フェーズで残りの参照エラーを解消するために追加の型をエクスポート
 * 
 * 依存方向：common → domain → store（循環参照を防ぐために逆方向の依存は避ける）
 * 
 * ※重要※：ストア型のインポートは必ずこのディレクトリから直接行ってください
 * 良い例: import { AppState } from '@/types/store/app';
 * 悪い例: import { AppState } from '@/types'; // 循環参照の原因になります
 */

// チャート関連の型を明示的にエクスポート（コンポーネントから参照されるため）
export type { IndicatorType, ActiveIndicator, DrawingToolType } from './chart';

// UI関連の型を明示的にエクスポート
export type { TabType } from './ui';

// ストアドメイン固有の型をエクスポート
export * from './app';
export * from './chart';
export * from './market';
export * from './ui';

// アプリケーションの状態全体を表す型
export interface StoreState {
  chart: import('./chart').ChartDataState & 
         import('./chart').ChartConfigState & 
         import('./chart').IndicatorState & 
         import('./chart').DrawingToolState & 
         import('./chart').RealTimeState;
  market: import('./market').MarketState;
  ui: import('./ui').UIState;
  app: import('./app').AppState;
}

// 後方互換性のためのコメント
/**
 * 以下の型は各ファイルから直接インポートしてください:
 * - AppState: './app'
 * - UIState, TabType: './ui'
 * - ChartDataState, ChartConfigState, IndicatorState, DrawingToolState, RealTimeState: './chart'
 * - MarketState: './market'
 * - IndicatorType, ActiveIndicator, DrawingToolType: './chart'
 * - SymbolInfo: '@/types/common/symbol'
 * - FilterOptions (StoreFilterOptions): '@/types/store.ts'
 */

import type { StateCreator, StoreApi } from 'zustand'
import type { TabType, IndicatorType, DrawingToolType } from './ui'
import type { DrawingTool } from './chart'

export { TabType, IndicatorType, DrawingToolType, DrawingTool }

// スライスクリエーター型定義
// これは各スライスが共通で使用する型です
export type SliceCreator<TSlice> = (
  set: (fn: (state: any) => any) => any,
  get: () => any,
  api?: any
) => TSlice 