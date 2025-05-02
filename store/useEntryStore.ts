// store/useEntryStore.ts
// 更新: 新しい型定義を使用するエントリー（トレードポジション）関連の状態管理ストア

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Entry, EntryState, OpenEntry } from "@/types/entry";


// エントリーストアの作成
export const useEntryStore = create<EntryState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初期状態
        entries: [],
        pendingEntry: null,

        // アクション
        setPendingEntry: (pendingEntry: OpenEntry | null) => set({ pendingEntry }),

        executeEntry: () => {
          const { pendingEntry, entries } = get();
          if (pendingEntry) {
            const newEntry = {
              ...pendingEntry,
              id: pendingEntry.id || `entry-${Date.now()}`,
              status: "open" as const,
            };
            set({ entries: [...entries, newEntry], pendingEntry: null });
          }
        },

        closePosition: (entryId, exitPrice) => {
          const { entries } = get();
          const updatedEntries = entries.map((entry) => {
            if (entry.id === entryId) {
              const profit = entry.side === "buy" 
                ? exitPrice - entry.price 
                : entry.price - exitPrice;
              return {
                ...entry,
                status: "closed" as const,
                exitPrice,
                exitTime: new Date().toISOString(),
                profit,
              };
            }
            return entry;
          });
          set({ entries: updatedEntries });
        },

        cancelPosition: (entryId) => {
          const { entries } = get();
          const updatedEntries = entries.map((entry) => {
            if (entry.id === entryId) {
              return {
                ...entry,
                status: "canceled" as const,
              };
            }
            return entry;
          });
          set({ entries: updatedEntries });
        },
      }),
      {
        name: "entry-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          entries: state.entries,
        }),
      }
    ),
    { name: "entry-store" }
  )
);
