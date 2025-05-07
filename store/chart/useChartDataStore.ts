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
        fetchData: async (symbol: string, timeFrame: Timeframe, signal?: AbortSignal) => {
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
          // 現在のタイムフレームと同じ場合は何もしない
          const currentTimeFrame = get().currentTimeFrame;
          if (timeFrame === currentTimeFrame) {
            logger.info(`Timeframe already set to ${timeFrame}, skipping update`, {
              component: 'useChartDataStore',
              action: 'updateTimeFrame'
            });
            return;
          }
          
          // ログ出力
          logger.info(`Changing timeframe from ${currentTimeFrame} to ${timeFrame}`, {
            component: 'useChartDataStore',
            action: 'updateTimeFrame'
          });
          
          // 先にタイムフレームを更新してUIに即反映
          set({ 
            currentTimeFrame: timeFrame,
            isLoading: true,
            error: null
          });
          
          // 現在のシンボルと新しいタイムフレームを保存
          const symbol = get().currentSymbol;
          
          // 非同期で実行してUIのブロックを避ける
          setTimeout(async () => {
            try {
              // 最新の状態を取得
              const state = get();
              
              // 非同期処理中にシンボルが変更されていないか確認
              if (symbol !== state.currentSymbol) {
                logger.info(`Symbol changed during async operation from ${symbol} to ${state.currentSymbol}, using new symbol`, {
                  component: 'useChartDataStore',
                  action: 'updateTimeFrame'
                });
              }
              
              // 最新のタイムフレームが変更されていないか確認
              if (timeFrame !== state.currentTimeFrame) {
                logger.info(`Timeframe changed during async operation from ${timeFrame} to ${state.currentTimeFrame}, skipping fetch`, {
                  component: 'useChartDataStore',
                  action: 'updateTimeFrame'
                });
                return;
              }
              
              await get().fetchData(state.currentSymbol, timeFrame);
              
              // WebSocket購読を更新
              try {
                const { startRealTimeUpdates } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
                startRealTimeUpdates();
              } catch (e) {
                logger.warn('Failed to update real-time updates', {
                  component: 'useChartDataStore',
                  action: 'updateTimeFrame',
                  error: e
                });
              }
            } catch (e) {
              logger.error('Failed to fetch data after timeframe update', {
                component: 'useChartDataStore',
                action: 'updateTimeFrame',
                error: e
              });
            }
          }, 50); // 状態更新後に実行するために少し遅延させる
        },
        
        updateSymbol: async (symbol: string) => {
          // 現在のシンボルと同じ場合は何もしない
          const currentSymbol = get().currentSymbol;
          if (symbol === currentSymbol) {
            logger.info(`Symbol already set to ${symbol}, skipping update`, {
              component: 'useChartDataStore',
              action: 'updateSymbol'
            });
            return;
          }
          
          // ログ出力
          logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
            component: 'useChartDataStore',
            action: 'updateSymbol'
          });
          
          // 現在のタイムフレームを保存
          const timeFrame = get().currentTimeFrame;
          
          // 先にシンボルを更新してUIに即反映
          set({ 
            currentSymbol: symbol,
            isLoading: true,
            error: null
          });
          
          // 新しいシンボルと現在のタイムフレームでデータを取得
          // 非同期で実行してUIのブロックを避ける
          setTimeout(async () => {
            try {
              // 最新の状態を取得
              const state = get();
              
              // 非同期処理中にシンボルが再度変更されていないか確認
              if (symbol !== state.currentSymbol) {
                logger.info(`Symbol changed again during async operation from ${symbol} to ${state.currentSymbol}, skipping fetch`, {
                  component: 'useChartDataStore',
                  action: 'updateSymbol'
                });
                return;
              }
              
              // 非同期処理中にタイムフレームが変更されていないか確認
              if (timeFrame !== state.currentTimeFrame) {
                logger.info(`Timeframe changed during async operation from ${timeFrame} to ${state.currentTimeFrame}, using new timeframe`, {
                  component: 'useChartDataStore',
                  action: 'updateSymbol'
                });
              }
              
              // 最新のシンボルとタイムフレームでデータを取得
              await get().fetchData(state.currentSymbol, state.currentTimeFrame);
              
              // WebSocket購読を更新
              try {
                const { startRealTimeUpdates } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
                startRealTimeUpdates();
              } catch (e) {
                logger.warn('Failed to update real-time updates', {
                  component: 'useChartDataStore',
                  action: 'updateSymbol',
                  error: e
                });
              }
            } catch (e) {
              logger.error('Failed to fetch data after symbol update', {
                component: 'useChartDataStore',
                action: 'updateSymbol',
                error: e
              });
            }
          }, 50); // 状態更新後に実行するために少し遅延させる
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
