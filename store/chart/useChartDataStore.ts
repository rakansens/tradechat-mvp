// store/chart/useChartDataStore.ts
// 更新: チャートデータ関連の状態管理ストア
// 
// このストアはチャートのデータ（OHLC）と、データの取得状態を管理します。
// リアルタイム更新用のメソッドも提供します。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "../../utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "../../utils/chartUtils";
import type { OHLCData, Timeframe } from "../../types/chart";
import type { ChartDataState } from "../../types/store";
import { produce } from "immer";
import { BitgetApiClient } from '../../services/bitgetApi';
import { logger } from '../../utils/logger';

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
            logger.error('Failed to fetch data from Bitget API:', error, {
              component: 'useChartDataStore',
              action: 'fetchData',
              symbol,
              timeframe: timeFrame
            });
            
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
        },
        
        // リアルタイム更新用のメソッド
        updateLastCandle: (newCandle: OHLCData) => {
          // データのパフォーマンスを最適化するためにimmerを使用
          set(produce((state) => {
            const data = state.data;
            
            // 最後のローソク足を探す
            const lastIndex = data.length - 1;
            const lastCandle = data[lastIndex];
            
            // 同じタイムスタンプのローソク足を更新
            if (lastCandle && lastCandle.time === newCandle.time) {
              data[lastIndex] = newCandle;
            } 
            // 新しいタイムスタンプのローソク足を追加
            else {
              data.push(newCandle);
              
              // 古いデータを削除してパフォーマンスを維持
              if (data.length > 1000) {
                data.shift();
              }
            }
          }));
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
