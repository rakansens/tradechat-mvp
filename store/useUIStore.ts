// store/useUIStore.ts
// 更新: 新しい型定義を使用するUI関連の状態管理ストア

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { AppTab, UIState } from "@/types/ui";


// UIストアの作成
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // 初期状態
        activeTab: "chart" as AppTab,

        // アクション
        setActiveTab: (activeTab: AppTab) => set({ activeTab }),
      }),
      {
        name: "ui-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: "ui-store" }
  )
);
