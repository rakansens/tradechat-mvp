// store/chart/useIndicatorStore.ts
// 作成: インジケーター関連の状態管理ストア
// 更新: ファクトリーパターンを使用し、パラメーター管理を追加
// 
// このストアはチャートのテクニカルインジケーターの表示状態とパラメーターを管理します。
/**
 * @deprecated rootStore の IndicatorSlice へ移行済み。削除予定。
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { IndicatorState, IndicatorType, ActiveIndicator } from "../../types/store";
import { getDefaultIndicatorParams } from "../../utils/indicatorFactory";

// インジケーターストアの作成
export const useIndicatorStore = create<IndicatorState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        activeIndicators: [],
        
        // アクション
        toggleIndicator: (indicator: IndicatorType, params?: Record<string, any>) => {
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
        
        updateIndicatorParams: (indicator: IndicatorType, params: Record<string, any>) => {
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
        
        getIndicatorParams: (indicator: IndicatorType) => {
          const activeIndicator = get().activeIndicators.find(item => item.type === indicator);
          return activeIndicator?.params;
        },
        
        isIndicatorActive: (indicator: IndicatorType) => {
          return get().activeIndicators.some(item => item.type === indicator);
        },
        
        clearAllIndicators: () => {
          set({ activeIndicators: [] });
        }
      }),
      {
        name: "indicator-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          activeIndicators: state.activeIndicators
        }),
      }
    ),
    { name: "indicator-store" }
  )
);
