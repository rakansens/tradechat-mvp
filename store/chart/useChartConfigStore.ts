// store/chart/useChartConfigStore.ts
// 作成: チャート設定関連の状態管理ストア
// 
// このストアはチャートの表示設定（チャートタイプ、取引種別など）を管理します。
/**
 * @deprecated rootStore の ChartConfigSlice に置き換えられました。削除予定。
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ChartType } from "../../types/chart";
import type { ChartConfigState } from "../../types/store";
import { ExchangeType } from "../../types/api";
// 循環参照を避けるためにイベント駆動型のアプローチを使用

// チャート設定ストアの作成
export const useChartConfigStore = create<ChartConfigState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        chartType: "candles",
        exchangeType: "spot",
        
        // アクション
        setChartType: (chartType: ChartType) => {
          set({ chartType });
        },
        
        setExchangeType: (exchangeType: ExchangeType) => {
          set({ exchangeType });
          
          // 注意: 実際の実装では、ここでRealTimeStoreのAPIクライアントを更新する必要があります
          // 循環参照を避けるために、イベント駆動型のアプローチやコンテキストプロバイダーを使用することを検討してください
          // 例: eventEmitter.emit('exchangeTypeChanged', exchangeType);
        }
      }),
      {
        name: "chart-config-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          chartType: state.chartType,
          exchangeType: state.exchangeType
        }),
      }
    ),
    { name: "chart-config-store" }
  )
);
