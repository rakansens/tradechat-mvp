/**
 * components/position/history/hooks/useHistoryTabs.ts
 * 
 * ポジション履歴のタブ状態とフィルタリングを管理するフック
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxからロジックを抽出
 * - 2025-6-26: "all"タブを追加し、"canceled"も対応
 */

import { useState, useMemo } from "react"
import type { Entry } from "@/types/entry"

export type HistoryTab = "all" | "open" | "closed" | "canceled"

/**
 * ポジション履歴のタブ状態とフィルタリングを管理するフック
 * 
 * @param entries すべてのエントリー配列
 * @returns タブ状態と、フィルタリングされたエントリー配列
 */
export function useHistoryTabs(entries: Entry[]) {
  // タブの状態管理
  const [selectedTab, setSelectedTab] = useState<HistoryTab>("open")

  // 選択されたタブに基づいてエントリーをフィルタリング
  const filteredEntries = useMemo(() => {
    if (selectedTab === "all") {
      return entries;
    }
    
    return entries.filter((entry) => entry.status === selectedTab)
  }, [entries, selectedTab])

  return {
    selectedTab,
    setSelectedTab,
    filteredEntries,
  }
}

export default useHistoryTabs 