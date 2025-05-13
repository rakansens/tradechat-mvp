/**
 * components/position/history/hooks/useHistoryTabs.ts
 * 
 * ポジション履歴のタブ状態とフィルタリングを管理するフック
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxからロジックを抽出
 */

import { useState, useMemo } from "react"
import type { Entry } from "@/types/entry"

export type HistoryTab = "open" | "closed"

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
    return entries.filter((entry) =>
      selectedTab === "open"
        ? entry.status === "open"
        : entry.status === "closed"
    )
  }, [entries, selectedTab])

  return {
    selectedTab,
    setSelectedTab,
    filteredEntries,
  }
}

export default useHistoryTabs 