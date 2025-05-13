/**
 * hooks/chart/index.ts
 * チャート関連Hookのバレルエクスポート
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxのリファクタリングに伴い作成
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い追加
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い追加
 */

// 各モジュールをエクスポート
export * from '@/components/chart/core/useChartCore';
export * from '@/components/chart/indicators/useIndicators';
export * from '@/components/chart/drawings/useDrawingTools';
export * from '@/components/chart/events/useChartEvents'; 

// ChartContainer.tsx リファクタリング用の新規フック
export * from './useChartStores';
export * from './useRealTimeCleanup';
// ローカルのuseChartEventsを別名でエクスポート
export { useChartEvents as useChartGlobalEvents } from './useChartEvents';

// ChartSection.tsx リファクタリング用の新規フック
export * from './useChartSectionStores';
export * from './useChartSectionInit';
export * from './useChartSectionCleanup';

export { default as usePriceMetrics } from './usePriceMetrics';
export { default as useToolbarStores } from './useToolbarStores';
export { default as useToolbarEvents } from './useToolbarEvents';

// 既存のフックもバレルエクスポートに含める
// 後続のパッチで実装されるフックのためのプレースホルダー
// export { default as useChartSectionStores } from './useChartSectionStores';
// export { default as useChartSectionInit } from './useChartSectionInit'; 