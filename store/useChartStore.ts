// store/useChartStore.ts
// 更新: 新しい型定義を使用するチャート関連の状態管理ストア
// 更新: 一目均衡表とフィボナッチリトレースメントのサポートを追加

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { generateOHLCData } from "../utils/ohlcDummyData";
import { getDataPointsForTimeframe } from "../utils/chart";
import type { ChartType, OHLCData, Timeframe } from "../types/chart";
import { BitgetApiClient, ExchangeType } from '../services/bitgetApi';


// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  getDataPointsForTimeframe(initialTimeframe),
  initialTimeframe
);

// インジケーターの種類を定義
type IndicatorType = 'rsi' | 'macd' | 'ichimoku';

// 描画ツールの種類を定義
type DrawingToolType = 'fibonacci' | 'rectangle';

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
  activeIndicators: IndicatorType[]; // アクティブなインジケーター
  activeDrawingTools: DrawingToolType[]; // アクティブな描画ツール
  
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
  toggleIndicator: (indicator: IndicatorType) => void; // インジケーターの表示切替
  toggleDrawingTool: (tool: DrawingToolType) => void; // 描画ツールの表示切替
  clearAllDrawingTools: () => void; // すべての描画ツールをクリア
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
        useRealTimeData: true, // リアルタイムデータをデフォルトで有効に設定
        exchangeType: 'spot', // デフォルトはスポット取引
        activeIndicators: [], // アクティブなインジケーターの初期値は空配列
        activeDrawingTools: [], // アクティブな描画ツールの初期値は空配列

        initializeChart: async (symbol: string, timeFrame: Timeframe) => {
          set({ isLoading: true, error: null, currentSymbol: symbol, currentTimeFrame: timeFrame });
          
          try {
            // BitgetAPIクライアントの初期化（取引種別を設定）
            const api = new BitgetApiClient({}, get().exchangeType);
            set({ bitgetApi: api });
            
            // 初期データの取得
            let historicalData: OHLCData[] = [];
            
            if (get().useRealTimeData) {
              try {
                console.log(`Fetching historical data for ${symbol} with timeframe ${timeFrame} (${get().exchangeType})`);
                // Bitget APIから過去のローソク足データを取得
                historicalData = await api.getHistoricalCandles(symbol, timeFrame, 100);
                console.log('Successfully fetched historical data:', historicalData.length);
              } catch (error) {
                console.error('Failed to fetch data from Bitget API, using dummy data instead:', error);
                // APIが失敗した場合はダミーデータを使用
                historicalData = generateOHLCData(100, timeFrame);
                // エラーメッセージを設定
                set({ 
                  error: error instanceof Error 
                    ? `API error: ${error.message}` 
                    : 'Failed to fetch data from Bitget API'
                });
              }
            } else {
              // リアルタイムデータを使用しない場合は常にダミーデータを使用
              console.log('Using dummy data (real-time data disabled)');
              historicalData = generateOHLCData(100, timeFrame);
            }
            
            set({ data: historicalData, isLoading: false });
            
            // リアルタイム更新を開始（リアルタイムデータが有効な場合のみ）
            if (get().useRealTimeData) {
              get().startRealTimeUpdates();
            }
          } catch (error) {
            console.error('Error initializing chart:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to initialize chart',
              isLoading: false,
              // エラー時もダミーデータを設定してUIを表示可能にする
              data: generateOHLCData(100, timeFrame)
            });
          }
        },

        updateTimeFrame: async (timeFrame: Timeframe) => {
          const { currentSymbol, bitgetApi, useRealTimeData, exchangeType } = get();
          
          set({ isLoading: true, currentTimeFrame: timeFrame });
          
          try {
            // WebSocketの購読を停止
            get().stopRealTimeUpdates();
            
            // 新しいタイムフレームでデータを再取得
            let historicalData: OHLCData[] = [];
            
            if (useRealTimeData && bitgetApi) {
              try {
                console.log(`Updating timeframe to ${timeFrame} for ${currentSymbol} (${exchangeType})`);
                historicalData = await bitgetApi.getHistoricalCandles(currentSymbol, timeFrame, 100);
              } catch (error) {
                console.error('Failed to fetch data from Bitget API, using dummy data instead:', error);
                historicalData = generateOHLCData(100, timeFrame);
                // エラーメッセージを設定
                set({ 
                  error: error instanceof Error 
                    ? `API error: ${error.message}` 
                    : 'Failed to fetch data from Bitget API'
                });
              }
            } else {
              // リアルタイムデータを使用しない場合は常にダミーデータを使用
              historicalData = generateOHLCData(100, timeFrame);
            }
            
            set({ data: historicalData, isLoading: false });
            
            // 新しいタイムフレームでリアルタイム更新を再開（リアルタイムデータが有効な場合のみ）
            if (useRealTimeData) {
              get().startRealTimeUpdates();
            }
          } catch (error) {
            console.error('Error updating time frame:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update time frame',
              isLoading: false,
              // エラー時もダミーデータを設定してUIを表示可能にする
              data: generateOHLCData(100, timeFrame)
            });
          }
        },

        updateSymbol: async (symbol: string) => {
          const { currentTimeFrame, bitgetApi, useRealTimeData, exchangeType } = get();
          
          set({ isLoading: true, currentSymbol: symbol });
          
          try {
            // WebSocketの購読を停止
            get().stopRealTimeUpdates();
            
            // 新しいシンボルでデータを再取得
            let historicalData: OHLCData[] = [];
            
            if (useRealTimeData && bitgetApi) {
              try {
                console.log(`Updating symbol to ${symbol} with timeframe ${currentTimeFrame} (${exchangeType})`);
                historicalData = await bitgetApi.getHistoricalCandles(symbol, currentTimeFrame, 100);
              } catch (error) {
                console.error('Failed to fetch data from Bitget API, using dummy data instead:', error);
                historicalData = generateOHLCData(100, currentTimeFrame);
                // エラーメッセージを設定
                set({ 
                  error: error instanceof Error 
                    ? `API error: ${error.message}` 
                    : 'Failed to fetch data from Bitget API'
                });
              }
            } else {
              // リアルタイムデータを使用しない場合は常にダミーデータを使用
              historicalData = generateOHLCData(100, currentTimeFrame);
            }
            
            set({ data: historicalData, isLoading: false });
            
            // 新しいシンボルでリアルタイム更新を再開（リアルタイムデータが有効な場合のみ）
            if (useRealTimeData) {
              get().startRealTimeUpdates();
            }
          } catch (error) {
            console.error('Error updating symbol:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update symbol',
              isLoading: false,
              // エラー時もダミーデータを設定してUIを表示可能にする
              data: generateOHLCData(100, currentTimeFrame)
            });
          }
        },

        updateData: (newCandle: OHLCData) => {
          set((state) => {
            const existingData = [...state.data];
            const lastCandleIndex = existingData.findIndex(candle => candle.time === newCandle.time);
            
            if (lastCandleIndex !== -1) {
              // 既存のローソク足を更新
              existingData[lastCandleIndex] = newCandle;
            } else {
              // 新しいローソク足を追加
              existingData.push(newCandle);
              // 表示するデータ量を制限（最新の100件のみ表示）
              if (existingData.length > 100) {
                existingData.shift();
              }
            }
            
            return { data: existingData };
          });
        },

        startRealTimeUpdates: () => {
          const { bitgetApi, currentSymbol, currentTimeFrame, useRealTimeData } = get();
          
          if (!useRealTimeData) {
            console.log('Real-time updates are disabled');
            return;
          }
          
          if (!bitgetApi) {
            console.warn('BitgetAPI client not initialized');
            return;
          }
          
          // WebSocketを使ってリアルタイムデータの購読を開始
          try {
            // ブラウザでのWebSocket接続エラーを回避
            if (typeof window !== 'undefined') {
              // リアルタイムデータの受信ハンドラを登録
              bitgetApi.onKlineUpdate((newCandle) => {
                get().updateData(newCandle);
              });
              
              // ローソク足データの購読を開始
              bitgetApi.subscribeToKline(currentSymbol, currentTimeFrame);
            } else {
              console.log('WebSocket not supported in current environment');
            }
          } catch (error) {
            console.error('Error starting real-time updates:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Failed to start real-time updates'
            });
          }
        },

        stopRealTimeUpdates: () => {
          const { bitgetApi } = get();
          
          if (bitgetApi) {
            // WebSocketコネクションを切断
            bitgetApi.disconnectWebSocket();
          }
        },

        setChartType: (chartType: ChartType) => set({ chartType }),
        
        toggleRealTimeData: () => {
          const { useRealTimeData, currentSymbol, currentTimeFrame } = get();
          
          // リアルタイムデータの使用を切り替え
          set({ useRealTimeData: !useRealTimeData });
          
          // 切り替え後に再初期化
          if (!useRealTimeData) {
            // オンに切り替えた場合、チャートを初期化
            get().initializeChart(currentSymbol, currentTimeFrame);
          } else {
            // オフに切り替えた場合、WebSocketを切断してダミーデータを使用
            get().stopRealTimeUpdates();
            const dummyData = generateOHLCData(100, currentTimeFrame);
            set({ data: dummyData });
          }
        },

        // 取引種別を設定するアクション
        setExchangeType: (type: ExchangeType) => {
          const { bitgetApi, currentSymbol, currentTimeFrame } = get();
          
          // 現在と同じ取引種別の場合は何もしない
          if (get().exchangeType === type) return;
          
          set({ exchangeType: type });
          
          // 既存のAPIクライアントがある場合、取引種別を更新
          if (bitgetApi) {
            bitgetApi.setExchangeType(type);
          }
          
          // 取引種別変更後にチャートを再初期化
          get().initializeChart(currentSymbol, currentTimeFrame);
        },
        
        // インジケーターの表示切替
        toggleIndicator: (indicator: IndicatorType) => {
          const { activeIndicators } = get();
          const isActive = activeIndicators.includes(indicator);
          
          if (isActive) {
            // インジケーターが既にアクティブな場合は削除
            set({
              activeIndicators: activeIndicators.filter(i => i !== indicator)
            });
          } else {
            // インジケーターがアクティブでない場合は追加
            set({
              activeIndicators: [...activeIndicators, indicator]
            });
          }
        },
        
        // 描画ツールの表示切替
        toggleDrawingTool: (tool: DrawingToolType) => {
          const { activeDrawingTools } = get();
          const isActive = activeDrawingTools.includes(tool);
          
          if (isActive) {
            // 描画ツールが既にアクティブな場合は削除
            set({
              activeDrawingTools: activeDrawingTools.filter(t => t !== tool)
            });
          } else {
            // 描画ツールがアクティブでない場合は追加
            set({
              activeDrawingTools: [...activeDrawingTools, tool]
            });
          }
        },
        
        // すべての描画ツールをクリア
        clearAllDrawingTools: () => {
          set({ activeDrawingTools: [] });
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
          exchangeType: state.exchangeType
        }),
      }
    ),
    { name: "chart-store" }
  )
);
