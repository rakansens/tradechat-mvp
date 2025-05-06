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
import { useChartConfigStore } from './useChartConfigStore';

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
            // useChartConfigStoreから現在の取引タイプを取得
            const { exchangeType } = useChartConfigStore.getState();
            
            if (process.env.NODE_ENV !== 'production') {
              console.log('[fetchData] exchangeType:', exchangeType, 'symbol:', symbol, 'timeframe:', timeFrame);
            }
            
            // 正しい取引タイプでAPIクライアントを作成
            const api = new BitgetApiClient({}, exchangeType);
            
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
            
            // リアルタイムストアで新しいシンボル/タイムフレームを購読し直す
            try {
              const { startRealTimeUpdates, useRealTimeData } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
              if (useRealTimeData) {
                startRealTimeUpdates();
              }
            } catch (e) {
              // 循環参照の回避やSSR環境での安全性のため、動的import
            }
            
            return historicalData;
          } catch (error) {
            logger.error('Failed to fetch data from Bitget API:', error, {
              component: 'useChartDataStore',
              action: 'fetchData',
              symbol,
              timeframe: timeFrame
            });
            
            // エラーメッセージを取得
            let errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
            
            const { exchangeType } = useChartConfigStore.getState();
            // 先物取引でサポートされていない銘柄のエラーの場合は、よりユーザーフレンドリーなメッセージに変換
            if (
              errorMessage.includes('先物取引でサポートされていません') ||
              (
                exchangeType === 'futures' &&
                (errorMessage.includes('status code 400') || errorMessage.includes('Bad Request'))
              )
            ) {
              // 現物取引に切り替えるオプションを提供するメッセージ
              errorMessage = `この銘柄は先物取引で利用できません。現物取引をお試しください。`;
              
              // 現物取引に切り替えるオプションを提供する場合は、ここで自動的に切り替えるロジックを追加できます
              // 例: useChartConfigStore.getState().setExchangeType('spot');
            }
            
            // APIが失敗した場合はダミーデータを使用
            const dummyData = generateOHLCData(100, timeFrame);
            set({ 
              data: dummyData,
              isLoading: false,
              error: errorMessage,
              currentSymbol: symbol,         // エラー時でも現在のシンボルを保持
              currentTimeFrame: timeFrame    // エラー時でも現在のタイムフレームを保持
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
          // 先にタイムフレームを更新してUIに即反映
          set({ currentTimeFrame: timeFrame });
          
          // 現在のシンボルと新しいタイムフレームでデータを取得
          await get().fetchData(get().currentSymbol, timeFrame);
          
          // WebSocket購読を更新
          try {
            const { startRealTimeUpdates } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
            startRealTimeUpdates();
          } catch {}
        },
        
        updateSymbol: async (symbol: string) => {
          // 先にシンボルを更新してUIに即反映
          set({ currentSymbol: symbol });
          
          // 新しいシンボルと現在のタイムフレームでデータを取得
          await get().fetchData(symbol, get().currentTimeFrame);
          
          try {
            const { startRealTimeUpdates } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
            startRealTimeUpdates();
          } catch {}
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
