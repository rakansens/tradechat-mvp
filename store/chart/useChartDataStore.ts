// store/chart/useChartDataStore.ts
// 作成: チャートデータ関連の状態管理ストア
// 
// このストアはチャートのデータ（OHLC）と、データの取得状態を管理します。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "../../utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "../../utils/chartUtils";
import type { OHLCData, Timeframe } from "../../types/chart";
import type { ChartDataState } from "../../types/store";
import { BitgetApiClient } from '../../services/bitgetApi';

// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  getDataPointsForTimeframe(initialTimeframe),
  initialTimeframe
);

// チャートデータストアの作成
export const useChartDataStore = create<ChartDataState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        data: initialOhlcData,
        isLoading: false,
        error: null,
        currentSymbol: 'BTC/USDT',
        currentTimeFrame: initialTimeframe,
        
        // アクション
        fetchData: async (symbol: string, timeFrame: Timeframe) => {
          set({ isLoading: true, error: null });
          
          try {
            // 新しいAPIクライアントを作成
            // 注意: 実際の実装では、APIクライアントはRealTimeStoreから取得するべきです
            // ここでは循環参照を避けるために直接作成しています
            const api = new BitgetApiClient({}, 'spot');
            
            // Bitget APIから過去のローソク足データを取得
            const historicalData = await api.getHistoricalCandles(symbol, timeFrame, 100);
            
            if (historicalData.length === 0) {
              throw new Error('No data returned from API');
            }
            
            set({ 
              data: historicalData,
              isLoading: false,
              currentSymbol: symbol,
              currentTimeFrame: timeFrame
            });
            
            return historicalData;
          } catch (error) {
            console.error('Failed to fetch data from Bitget API:', error);
            
            // APIが失敗した場合はダミーデータを使用
            const dummyData = generateOHLCData(100, timeFrame);
            set({ 
              data: dummyData,
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to fetch data'
            });
            
            return dummyData;
          }
        },
        
        updateData: (newData: OHLCData) => {
          const currentData = [...get().data];
          
          // 新しいデータのタイムスタンプが既存のデータに存在するか確認
          const existingIndex = currentData.findIndex(item => item.time === newData.time);
          
          if (existingIndex >= 0) {
            // 既存のデータを更新
            currentData[existingIndex] = newData;
          } else {
            // 新しいデータを追加
            currentData.push(newData);
            // 時間順にソート
            currentData.sort((a, b) => a.time - b.time);
          }
          
          set({ data: currentData });
        },
        
        updateTimeFrame: async (timeFrame: Timeframe) => {
          // 現在のシンボルと新しいタイムフレームでデータを取得
          await get().fetchData(get().currentSymbol, timeFrame);
        },
        
        updateSymbol: async (symbol: string) => {
          // 新しいシンボルと現在のタイムフレームでデータを取得
          await get().fetchData(symbol, get().currentTimeFrame);
        }
      }),
      {
        name: "chart-data-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          currentSymbol: state.currentSymbol,
          currentTimeFrame: state.currentTimeFrame
        }),
      }
    ),
    { name: "chart-data-store" }
  )
);
