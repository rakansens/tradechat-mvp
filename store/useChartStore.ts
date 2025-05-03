// store/useChartStore.ts
// 更新: 新しい型定義を使用するチャート関連の状態管理ストア
// 更新: 一目均衡表とフィボナッチリトレースメントのサポートを追加

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "@/utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "@/utils/chart";
import type { ChartType, OHLCData, Timeframe, TechnicalIndicator } from "@/types/chart";
import { BitgetApiClient, ExchangeType } from '../services/bitgetApi';


// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  getDataPointsForTimeframe(initialTimeframe),
  initialTimeframe
);

// デフォルトのインジケーター設定
const initialIndicators: TechnicalIndicator[] = [
  { type: "ma", params: { period: 20 }, visible: true },
  { type: "bollinger", params: { period: 20, stdDev: 2 }, visible: true },
  { type: "rsi", params: { period: 14 }, visible: true },
  { type: "macd", params: { fast: 12, slow: 26, signal: 9 }, visible: true },
  { type: "ichimoku", params: { tenkan: 9, kijun: 26, senkou: 52 }, visible: false },
  { type: "fibonacci", params: { auto: 1 }, visible: false }
];

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
  indicators: TechnicalIndicator[]; // テクニカル指標の設定
  
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
  toggleIndicator: (type: TechnicalIndicator["type"]) => void; // インジケーターの表示/非表示を切り替え
  updateIndicatorParams: (type: TechnicalIndicator["type"], params: Record<string, number>) => void; // インジケーターのパラメータを更新
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
        indicators: initialIndicators, // インジケーター設定を初期化

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
          set({ chartType });
        },

        toggleRealTimeData: () => {
          set(state => ({ useRealTimeData: !state.useRealTimeData }));
        },

        setExchangeType: (type: ExchangeType) => {
          set({ exchangeType: type });
        },

        // インジケーターの表示/非表示を切り替え
        toggleIndicator: (type) => {
          const { indicators = [] } = get();
          const newIndicators = indicators.map(ind => 
            ind.type === type 
              ? { ...ind, visible: !ind.visible } 
              : ind
          );
          set({ indicators: newIndicators });
        },

        // インジケーターのパラメータを更新
        updateIndicatorParams: (type, params) => {
          const { indicators = [] } = get();
          const newIndicators = indicators.map(ind => 
            ind.type === type 
              ? { ...ind, params: { ...ind.params, ...params } } 
              : ind
          );
          set({ indicators: newIndicators });
        }
      }),
      {
        name: "chart-storage-v2",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          currentSymbol: state.currentSymbol,
          currentTimeFrame: state.currentTimeFrame,
          chartType: state.chartType,
          useRealTimeData: state.useRealTimeData,
          exchangeType: state.exchangeType,
          indicators: state.indicators?.map(ind => ({ 
            type: ind.type, 
            visible: ind.visible,
            params: ind.params
          }))
        }),
      }
    ),
    { name: "chart-store" }
  )
);
