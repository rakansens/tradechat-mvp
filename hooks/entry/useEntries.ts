/**
 * hooks/entry/useEntries.ts
 * 
 * トレードエントリーを管理するカスタムフック
 * ポジションの作成、実行、キャンセル、クローズの機能を提供します
 * 
 * 変更履歴:
 * - 2023-04-10: 初期実装
 * - 2023-06-20: ポジションクローズ処理を追加
 * - 2023-10-05: キャンセル機能を追加
 * - 2025-05-14: フックのリファクタリングに伴いhooks/entryディレクトリに移動
 */

"use client"

import { useState } from "react"
import type { Entry } from "@/types"

/**
 * トレードエントリーを管理するフック
 * 
 * @param ohlcData チャートの価格データ配列
 * @returns エントリー関連の状態と操作関数
 */
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