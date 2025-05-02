"use client"

import { useState } from "react"
import type { Entry } from "@/types"

export function useEntries(ohlcData: any[]) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [pendingEntry, setPendingEntry] = useState<Entry | null>(null)

  // エントリーを実行
  const executeEntry = () => {
    if (pendingEntry) {
      // Add entry to the list with status
      const newEntry = {
        ...pendingEntry,
        id: pendingEntry.id || `entry-${Date.now()}`,
        status: "open" as const,
      }

      setEntries([...entries, newEntry])
      setPendingEntry(null)
    }
  }

  // ポジションを閉じる
  const handleClosePosition = (entryId: string, exitPrice: number) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === entryId) {
          const profit = entry.side === "buy" ? exitPrice - entry.price : entry.price - exitPrice

          return {
            ...entry,
            status: "closed" as const,
            exitPrice,
            exitTime: new Date().toISOString(),
            profit,
          }
        }
        return entry
      }),
    )
  }

  // ポジションをキャンセル
  const handleCancelPosition = (entryId: string) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === entryId) {
          return {
            ...entry,
            status: "canceled" as const,
          }
        }
        return entry
      }),
    )
  }

  return {
    entries,
    pendingEntry,
    setPendingEntry,
    executeEntry,
    handleClosePosition,
    handleCancelPosition,
  }
}
