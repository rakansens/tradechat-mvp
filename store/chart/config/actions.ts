// store/chart/config/actions.ts
// 作成: ChartConfigSliceのアクション定義

import type { StateCreator } from "zustand"
import type { ChartType } from "@/types/chart"
import { ExchangeType } from "@/types/api"
import type { ChartConfigSliceState } from "./state"

export interface ChartConfigActions {
  // チャートタイプを設定するアクション
  setChartType: (chartType: ChartType) => void
  
  // 取引タイプを設定するアクション
  setExchangeType: (exchangeType: ExchangeType) => void
}

export type ChartConfigSlice = ChartConfigSliceState & ChartConfigActions

/**
 * チャート設定スライスのアクションを作成する関数
 */
export const createChartConfigActions = <T extends ChartConfigSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): ChartConfigActions => ({
  // チャートタイプを設定
  setChartType: (chartType) => {
    set({ chartType } as Partial<T>)
  },
  
  // 取引タイプを設定
  setExchangeType: (exchangeType) => {
    set({ exchangeType } as Partial<T>)
    
    // 注意: 実際の実装では、ここでRealTimeStoreのAPIクライアントを更新するイベントを発行する
    // 循環参照を避けるために、イベント駆動型のアプローチを使用
    // 例: eventEmitter.emit('exchangeTypeChanged', exchangeType);
  }
}) 