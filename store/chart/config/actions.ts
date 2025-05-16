// store/chart/config/actions.ts
// 作成: ChartConfigSliceのアクション定義
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import type { ChartType } from "@/types/chart"
import { ExchangeType } from "@/types/network/api"
import { type ChartConfigSliceActions, type ChartConfigSlice, type ChartConfigSliceState } from "./types"

/**
 * チャート設定スライスのアクションを作成する関数
 */
export const createChartConfigActions = (
  set: (fn: (state: ChartConfigSliceState) => void) => void,
  get: () => ChartConfigSlice
): ChartConfigSliceActions => ({
  // チャートタイプを設定
  setChartType: (chartType) => {
    set(state => {
      state.chartType = chartType;
    });
  },
  
  // 取引タイプを設定
  setExchangeType: (exchangeType) => {
    set(state => {
      state.exchangeType = exchangeType;
    });
    
    // 注意: 実際の実装では、ここでRealTimeStoreのAPIクライアントを更新するイベントを発行する
    // 循環参照を避けるために、イベント駆動型のアプローチを使用
    // 例: eventEmitter.emit('exchangeTypeChanged', exchangeType);
  }
}); 