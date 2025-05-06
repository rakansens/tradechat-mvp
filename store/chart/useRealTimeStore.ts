// store/chart/useRealTimeStore.ts
// 更新: リアルタイム更新関連の状態管理ストアを最適化
// 
// このストアはリアルタイムデータの更新設定とWebSocket接続を管理します。
// メモ化されたセレクターを使用してパフォーマンスを向上させます。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { RealTimeState } from "../../types/store";
import { ExchangeType } from "../../types/api";
import { OHLCData } from "../../types/chart";
import { useChartDataStore } from "./useChartDataStore";
import { selectCurrentPrice } from "../chart/selectors";
import { logger } from "../../utils/logger";
import { socketService } from "../../services/socketService";

// リアルタイム更新ストアの作成
export const useRealTimeStore = create<RealTimeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        useRealTimeData: true,
        bitgetApi: null,
        
        // アクション
        initializeApi: (exchangeType: ExchangeType) => {
          try {
            // 共通のソケットサービスを使用してAPIクライアントを初期化
            const newApi = socketService.initializeApiClient(exchangeType);
            set({ bitgetApi: newApi });
            
            // リアルタイムデータが有効な場合はWebSocket接続を開始
            if (get().useRealTimeData) {
              get().startRealTimeUpdates();
            }
          } catch (error) {
            logger.error('API初期化エラー:', error, {
              component: 'useRealTimeStore',
              action: 'initializeApi'
            });
          }
        },
        
        startRealTimeUpdates: () => {
          // 現在のAPIクライアントを取得（socketServiceから直接取得することも可能）
          let api = get().bitgetApi || socketService.getCurrentApiClient();
          
          // APIクライアントが初期化されていない場合は初期化する
          if (!api) {
            try {
              // チャート設定ストアから現在の取引種別を取得
              const { exchangeType } = require('./useChartConfigStore').useChartConfigStore.getState();
              get().initializeApi(exchangeType);
              api = get().bitgetApi;
              
              // それでもAPIクライアントが初期化できない場合はエラーログを出力して終了
              if (!api) {
                logger.error('API client not initialized', null, {
                  component: 'useRealTimeStore',
                  action: 'startRealTimeUpdates'
                });
                return;
              }
            } catch (e) {
              logger.error('Failed to initialize API client', e, {
                component: 'useRealTimeStore',
                action: 'startRealTimeUpdates'
              });
              return;
            }
          }
          
          // チャートデータストアから現在のシンボルとタイムフレームを取得
          const chartDataStore = useChartDataStore.getState();
          const { currentSymbol, currentTimeFrame, updateLastCandle } = chartDataStore;
          
          // 現在の価格をメモ化されたセレクターで取得
          const lastPrice = selectCurrentPrice(chartDataStore);
          
          // WebSocket接続を開始
          api.subscribeToKline(currentSymbol, currentTimeFrame);
          
          // WebSocketからのデータ受信時のコールバックを設定
          api.onKlineUpdate((data: OHLCData) => {
            // メモ化されたセレクターを使用して最適化
            const newChartDataStore = useChartDataStore.getState();
            const currentLastPrice = selectCurrentPrice(newChartDataStore);
            
            // 価格が変化した場合のみ更新を実行
            if (data.close !== currentLastPrice) {
              updateLastCandle(data);
            }
          });
        },
        
        stopRealTimeUpdates: () => {
          try {
            const api = get().bitgetApi;
            if (!api) {
              logger.warn('API client not initialized when trying to stop updates.', {
                component: 'useRealTimeStore',
                action: 'stopRealTimeUpdates',
                note: 'This might be normal during cleanup.'
              });
              return;
            }
            
            // WebSocket接続を停止
            api.disconnectWebSocket();
          } catch (error) {
            logger.error('WebSocket切断エラー:', error, {
              component: 'useRealTimeStore',
              action: 'stopRealTimeUpdates'
            });
          }
        },
        
        toggleRealTimeData: () => {
          const newValue = !get().useRealTimeData;
          set({ useRealTimeData: newValue });
          
          if (newValue) {
            // リアルタイムデータを有効にした場合は更新を開始
            get().startRealTimeUpdates();
          } else {
            // リアルタイムデータを無効にした場合は更新を停止
            get().stopRealTimeUpdates();
          }
        }
      }),
      {
        name: "real-time-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          useRealTimeData: state.useRealTimeData
        }),
      }
    ),
    { name: "real-time-store" }
  )
);
