// store/useChartStore.ts
// 更新: 新しい型定義を使用するチャート関連の状態管理ストア

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "@/utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "@/utils/chart";
import type { ChartType, OHLCData, Timeframe } from "@/types/chart";
import { BitgetApiClient, ExchangeType } from '../services/bitgetApi';


// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  getDataPointsForTimeframe(initialTimeframe),
  initialTimeframe
);

interface ChartStoreState {
  data: OHLCData[];
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  bitgetApi: BitgetApiClient | null;
  chartType: ChartType;
  useRealTimeData: boolean; // リアルタイムデータを使用するかのフラグ
  exchangeType: ExchangeType; // 取引種別（スポットまたは先物）
  
  // アクション
  initializeChart: (symbol: string, timeFrame: Timeframe) => Promise<void>;
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  updateSymbol: (symbol: string) => Promise<void>;
  updateData: (data: OHLCData) => void;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  setChartType: (chartType: ChartType) => void;
  toggleRealTimeData: () => void; // リアルタイムデータの使用を切り替える
  setExchangeType: (type: ExchangeType) => void; // 取引種別を設定
}

// チャートストアの作成
export const useChartStore = create<ChartStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        data: initialOhlcData,
        isLoading: false,
        error: null,
        currentSymbol: 'BTC/USDT',
        currentTimeFrame: initialTimeframe,
        bitgetApi: null,
        chartType: "candles" as ChartType,
        useRealTimeData: true, // リアルタイムデータをデフォルトで有効に変更
        exchangeType: 'spot', // デフォルトはスポット取引

        // アクション
        initializeChart: async (symbol: string, timeFrame: Timeframe) => {
          // Implementation of initializeChart
        },

        updateTimeFrame: async (timeFrame: Timeframe) => {
          // Implementation of updateTimeFrame
        },

        updateSymbol: async (symbol: string) => {
          // Implementation of updateSymbol
        },

        updateData: (data: OHLCData) => {
          // Implementation of updateData
        },

        startRealTimeUpdates: () => {
          // Implementation of startRealTimeUpdates
        },

        stopRealTimeUpdates: () => {
          // Implementation of stopRealTimeUpdates
        },

        setChartType: (chartType: ChartType) => {
          // Implementation of setChartType
        },

        toggleRealTimeData: () => {
          // Implementation of toggleRealTimeData
        },

        setExchangeType: (type: ExchangeType) => {
          // Implementation of setExchangeType
        },
      }),
      {
        name: "chart-storage-v2",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          currentSymbol: state.currentSymbol,
          currentTimeFrame: state.currentTimeFrame,
          chartType: state.chartType,
          useRealTimeData: state.useRealTimeData,
          exchangeType: state.exchangeType
        }),
      }
    ),
    { name: "chart-store" }
  )
);
