/**
 * ストア関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはT-2フェーズでtypes/store.tsの型がストアドメイン関連ファイルに
 * 移動されました。
 * T-7フェーズで循環依存を解消するために再構成されました。
 * T-7.1フェーズで循環参照を完全に解消しました。
 * 
 * 依存方向：common → domain → store（循環参照を防ぐために逆方向の依存は避ける）
 * 
 * ※重要※：ストア型のインポートは必ずこのディレクトリから直接行ってください
 * 良い例: import { AppState } from '@/types/store/app';
 * 悪い例: import { AppState } from '@/types'; // 循環参照の原因になります
 */

// ストアドメイン固有の型をエクスポート
export * from './app';
export * from './chart';
export * from './market';
export * from './ui';

// 注意: 以下の循環参照を引き起こす再エクスポートをT-7.1で削除しました
// export type { ... } from '../index';

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