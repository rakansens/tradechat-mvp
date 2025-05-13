// store/entry/actions.ts
// 初期実装: エントリースライスのアクション

import type { Entry, OpenEntry } from "@/types/entry"
import type { EntrySliceState } from "./state"

// エントリースライスのアクション定義
export interface EntrySliceActions {
  // 保留中のエントリーを設定するアクション
  setPendingEntry: (entry: OpenEntry | null) => void
  
  // エントリーを実行（確定）するアクション
  executeEntry: () => void
  
  // 取引を終了するアクション
  closePosition: (entryId: string, exitPrice: number) => void
  
  // 取引をキャンセルするアクション
  cancelPosition: (entryId: string) => void
}

// エントリースライスのアクション作成関数
export const createEntryActions = (
  set: (fn: (state: EntrySliceState) => void) => void,
  get: () => EntrySliceState
): EntrySliceActions => ({
  
  // 保留中のエントリーを設定するアクション
  setPendingEntry: (pendingEntry) => {
    set((state) => {
      state.pendingEntry = pendingEntry
    })
  },
  
  // エントリーを実行（確定）するアクション
  executeEntry: () => {
    const { pendingEntry, entries } = get()
    if (pendingEntry) {
      set((state) => {
        state.entries = [...entries, pendingEntry]
        state.pendingEntry = null
      })
    }
  },
  
  // 取引を終了するアクション
  closePosition: (entryId, exitPrice) => {
    const { entries } = get()
    set((state) => {
      state.entries = entries.map((entry) => {
        if (entry.id === entryId && entry.status === "open") {
          const profit =
            entry.side === "buy" ? exitPrice - entry.price : entry.price - exitPrice
          // 型安全な変換を行う
          const closedEntry: Entry = {
            ...entry,
            status: "closed" as const,
            exitPrice,
            exitTime: new Date().toISOString(),
            profit,
          }
          return closedEntry
        }
        return entry
      })
    })
  },
  
  // 取引をキャンセルするアクション
  cancelPosition: (entryId) => {
    const { entries } = get()
    set((state) => {
      state.entries = entries.map((entry) => {
        if (entry.id === entryId && entry.status === "open") {
          // 型安全な変換を行う
          const canceledEntry: Entry = {
            ...entry,
            status: "canceled" as const,
          }
          return canceledEntry
        }
        return entry
      })
    })
  }
}) 