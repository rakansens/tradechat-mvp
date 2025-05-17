import type { RootStore } from '@/store/rootStore';

/**
 * RootStore からチャートタイプを取得するセレクター
 */
export const selectChartTypeFromRoot = (state: RootStore) => state.chartType;

/**
 * RootStore から取引所タイプを取得するセレクター
 */
export const selectExchangeTypeFromRoot = (state: RootStore) => state.exchangeType;
