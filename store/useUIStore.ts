// store/useUIStore.ts
// 更新: 型安全なUIストアの実装
// 
// このファイルはUIの状態（アクティブなタブ、ダークモード、サイドバーなど）を管理します。
// TabTypeを使用して型安全性を向上させています。

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TabType, UIState } from "../types/store";

// UIストアの作成
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // 初期状態
        activeTab: "chart",
        isDarkMode: false,
        isSidebarOpen: true,

        // アクション
        setActiveTab: (tab: TabType) => set({ activeTab: tab }),
        toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      }),
      {
        name: "ui-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          activeTab: state.activeTab,
          isDarkMode: state.isDarkMode,
          isSidebarOpen: state.isSidebarOpen,
        }),
      }
    ),
    { name: "ui-store" }
  )
);
