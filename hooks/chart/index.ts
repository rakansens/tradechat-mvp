/**
 * hooks/chart/index.ts
 * チャート関連Hookのバレルエクスポート
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い追加
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い追加
 * - 2025-06-15: H-1 Chart フェーズのリファクタリングでサブディレクトリ構造に変更
 */

// 外部コンポーネントからのインポート（名前衝突を防ぐために別名を使用）
export * from '@/components/chart/core/useChartCore';
export * from '@/components/chart/indicators/useIndicators';
export * from '@/components/chart/drawings/useDrawingTools';
export { 
  useChartEvents as useComponentChartEvents 
} from '@/components/chart/events/useChartEvents';

// サブディレクトリからエクスポート
export * from './canvas';
export * from './init';
export * from './toolbar';
export * from './realtime';

// useChartEventsをuseChartGlobalEventsという別名でもエクスポート（後方互換性維持）
export { useChartEvents as useChartGlobalEvents } from './canvas/useChartEvents';