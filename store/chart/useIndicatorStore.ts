// store/chart/useIndicatorStore.ts
// 作成: インジケーター関連の状態管理ストア
// 
// このストアはチャートのテクニカルインジケーターの表示状態を管理します。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { IndicatorState, IndicatorType } from "../../types/store";

// インジケーターストアの作成
export const useIndicatorStore = create<IndicatorState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        activeIndicators: [],
        
        // アクション
        toggleIndicator: (indicator: IndicatorType) => {
          const currentIndicators = [...get().activeIndicators];
          const indicatorIndex = currentIndicators.indexOf(indicator);
          
          if (indicatorIndex >= 0) {
            // インジケーターが既に有効な場合は無効化
            currentIndicators.splice(indicatorIndex, 1);
          } else {
            // インジケーターが無効な場合は有効化
            currentIndicators.push(indicator);
          }
          
          set({ activeIndicators: currentIndicators });
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
