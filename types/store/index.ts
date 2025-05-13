/**
 * ストア関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはT-2フェーズでtypes/store.tsの型がストアドメイン関連ファイルに
 * 移動されました。
 */

// T-2フェーズ実装
export * from './app';
export * from './chart';
export * from './market';
export * from './ui';

// 元のファイルからの互換性のためのエクスポート
// T-6フェーズで削除予定
export type {
  // store.ts
  IndicatorType, ActiveIndicator, DrawingToolType,
  ChartDataState, ChartConfigState, IndicatorState,
  DrawingToolState, RealTimeState, UIState,
  TabType, MarketState, SymbolInfo, FilterOptions,
  AppState
} from '../index';

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