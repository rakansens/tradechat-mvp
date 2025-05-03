// store/chart/useRealTimeStore.ts
// 作成: リアルタイム更新関連の状態管理ストア
// 
// このストアはリアルタイムデータの更新設定とWebSocket接続を管理します。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { RealTimeState } from "../../types/store";
import { BitgetApiClient } from "../../services/bitgetApi";
import { ExchangeType } from "../../types/api";
import { useChartDataStore } from "./useChartDataStore";

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
          // 既存のAPIクライアントがあれば切断
          const currentApi = get().bitgetApi;
          if (currentApi) {
            currentApi.disconnectWebSocket();
          }
          
          // 新しいAPIクライアントを作成
          const newApi = new BitgetApiClient({}, exchangeType);
          set({ bitgetApi: newApi });
          
          // リアルタイムデータが有効な場合はWebSocket接続を開始
          if (get().useRealTimeData) {
            get().startRealTimeUpdates();
          }
        },
        
        startRealTimeUpdates: () => {
          const api = get().bitgetApi;
          if (!api) {
            console.error('API client not initialized');
            return;
          }
          
          // チャートデータストアから現在のシンボルとタイムフレームを取得
          const chartDataStore = useChartDataStore.getState();
          const { currentSymbol, currentTimeFrame } = chartDataStore;
          
          // WebSocket接続を開始
          api.subscribeToKline(currentSymbol, currentTimeFrame);
          
          // TODO: Bitgetからの新しいデータを受信したらチャートデータストアを更新する
          // 実際の実装では、BitgetApiClientにコールバック登録メカニズムを追加する必要があります
        },
        
        stopRealTimeUpdates: () => {
          const api = get().bitgetApi;
          if (!api) {
            console.error('API client not initialized');
            return;
          }
          
          // WebSocket接続を停止
          api.disconnectWebSocket();
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
