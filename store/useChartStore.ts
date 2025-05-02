// store/useChartStore.ts
// 更新: 新しい型定義を使用するチャート関連の状態管理ストア

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "@/utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "@/utils/chart";
import type { ChartState, ChartType, OHLCData, Timeframe } from "@/types/chart";


// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  getDataPointsForTimeframe(initialTimeframe),
  initialTimeframe
);

// チャートストアの作成
export const useChartStore = create<ChartState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        timeframe: initialTimeframe,
        chartType: "candles" as ChartType,
        ohlcData: initialOhlcData,

        // アクション
        setTimeframe: (timeframe) => {
          set({ timeframe });
          get().refreshOhlcData();
        },

        setChartType: (chartType: ChartType) => set({ chartType }),

        refreshOhlcData: () => {
          const { timeframe } = get();
          const newData = generateOHLCData(
            getDataPointsForTimeframe(timeframe),
            timeframe
          );
          set({ ohlcData: newData });
        },
      }),
      {
        name: "chart-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          timeframe: state.timeframe,
          chartType: state.chartType,
        }),
      }
    ),
    { name: "chart-store" }
  )
);
