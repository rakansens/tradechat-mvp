// store/chart/config/actions.ts
// 作成: ChartConfigSliceのアクション定義
// 更新: 2025-10-14 - setExchangeProductType アクションを追加して型と実装を同期

import type { ChartType } from "@/types/chart";
import { ExchangeType, ExchangeProductType } from "@/types/constants/enums";
import {
  type ChartConfigSliceActions,
  type ChartConfigSlice,
  type ChartConfigSliceState
} from "./types";

/**
 * チャート設定スライスのアクションを作成する関数
 */
export const createChartConfigActions = (
  set: (fn: (state: ChartConfigSliceState) => void) => void,
  get: () => ChartConfigSlice
): ChartConfigSliceActions => ({
  // チャートタイプを設定
  setChartType: (chartType) => {
    set((state) => {
      state.chartType = chartType;
    });
  },

  // 取引所タイプを設定
  setExchangeType: (exchangeType) => {
    set((state) => {
      state.exchangeType = exchangeType;
    });

    // 循環参照を避けるため、イベント駆動型のアプローチを推奨
    // 例: eventEmitter.emit("exchangeTypeChanged", exchangeType);
  },

  // 取引種別（現物/先物など）を設定
  setProductType: (productType) => {
    set((state) => {
      state.productType = productType;
      state.exchangeProductType = productType;
    });

    // ここでも必要に応じてイベントを発行
    // 例: eventEmitter.emit("productTypeChanged", productType);
  },

  /**
   * @deprecated setProductType を使用してください
   */
  setExchangeProductType: (exchangeProductType) => {
    set((state) => {
      state.productType = exchangeProductType;
      state.exchangeProductType = exchangeProductType;
    });
  }
});
