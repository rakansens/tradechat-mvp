// store/chart/indicator/actions.ts
// 作成: IndicatorSliceのアクション定義
// 更新: T-7.5フェーズ - 型インポートパスを修正
// 更新: 2025-10-05 - 型定義をtypes.tsに移動し、そこから参照するように変更

import type { IndicatorType } from "@/types/store/chart";
import type { IndicatorSliceState, IndicatorSliceActions, IndicatorSlice } from "./types";
import { getDefaultIndicatorParams } from "@/utils/chart/indicatorFactory";

export interface IndicatorActions {
  // インジケーターの有効/無効を切り替えるアクション
  toggleIndicator: (indicator: IndicatorType, params?: Record<string, any>) => void
  
  // インジケーターのパラメーターを更新するアクション
  updateIndicatorParams: (indicator: IndicatorType, params: Record<string, any>) => void
  
  // 全てのインジケーターをクリアするアクション
  clearAllIndicators: () => void
}

export type IndicatorSlice = IndicatorSliceState & IndicatorActions

/**
 * インジケータースライスのアクションを作成する関数
 */
export const createIndicatorActions = (
  set: (state: Partial<IndicatorSliceState>) => void,
  get: () => IndicatorSlice
): IndicatorSliceActions => ({
  // インジケーターの有効/無効を切り替え
  toggleIndicator: (indicator, params) => {
    const currentIndicators = [...get().activeIndicators];
    const indicatorIndex = currentIndicators.findIndex(item => item.type === indicator);
    
    if (indicatorIndex >= 0) {
      // インジケーターが既に有効な場合は無効化
      currentIndicators.splice(indicatorIndex, 1);
    } else {
      // インジケーターが無効な場合は有効化
      // デフォルトパラメーターを取得し、必要に応じて上書き
      const defaultParams = getDefaultIndicatorParams(indicator);
      const finalParams = params ? { ...defaultParams, ...params } : defaultParams;
      
      currentIndicators.push({
        type: indicator,
        params: finalParams
      });
    }
    
    set({ activeIndicators: currentIndicators });
  },
  
  // インジケーターのパラメーターを更新
  updateIndicatorParams: (indicator, params) => {
    const currentIndicators = [...get().activeIndicators];
    const indicatorIndex = currentIndicators.findIndex(item => item.type === indicator);
    
    if (indicatorIndex >= 0) {
      // インジケーターが存在する場合はパラメーターを更新
      currentIndicators[indicatorIndex] = {
        ...currentIndicators[indicatorIndex],
        params: {
          ...currentIndicators[indicatorIndex].params,
          ...params
        }
      };
      set({ activeIndicators: currentIndicators });
    }
  },
  
  // 全てのインジケーターをクリア
  clearAllIndicators: () => {
    set({ activeIndicators: [] });
  }
}); 