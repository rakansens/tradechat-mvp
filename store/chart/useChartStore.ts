// store/chart/useChartStore.ts
// 作成: チャート表示の設定を管理するストア

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { DeepPartial, ChartOptions } from 'lightweight-charts';
import { ChartTimeframe, ChartStoreState } from '@/types/chartModels';

// ストアの初期状態
const initialState = {
  currentTimeframe: '1h' as ChartTimeframe,
  chartOptions: {
    layout: {
      background: { color: 'transparent' },
      textColor: '#D9D9D9',
    },
    grid: {
      vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
      horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: 'rgba(197, 203, 206, 0.8)',
    },
  },
  visibleIndicators: {
    ma7: false,
    ma25: false,
    ma99: false,
    bollinger: false,
    rsi: false,
    macd: false,
  },
};

/**
 * チャートの表示設定を管理するストア
 */
export const useChartStore = create<ChartStoreState>()(
  devtools(
    (set) => ({
      ...initialState,

      // タイムフレームを更新
      updateTimeframe: (timeframe) => set({ currentTimeframe: timeframe }),

      // チャートオプションを更新
      updateChartOptions: (options) => set((state) => ({
        chartOptions: { ...state.chartOptions, ...options },
      })),

      // インジケーターの表示状態を切り替え
      toggleIndicator: (indicator) => set((state) => ({
        visibleIndicators: {
          ...state.visibleIndicators,
          [indicator]: !state.visibleIndicators[indicator],
        },
      })),
    }),
    { name: 'chart-store' }
  )
); 