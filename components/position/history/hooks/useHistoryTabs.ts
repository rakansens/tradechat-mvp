/**
 * components/position/history/hooks/useHistoryTabs.ts
 * 
 * ポジション履歴のタブ状態とフィルタリングを管理するフック
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxからロジックを抽出
 * - 2025-6-26: "all"と"canceled"タブを追加
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
  // タブの状態管理 - 初期値はopen
  const [selectedTab, setSelectedTab] = useState<HistoryTab>("open")

  // 選択されたタブに基づいてエントリーをフィルタリング
  const filteredEntries = useMemo(() => {
    if (selectedTab === "all") {
      return entries;
    }
    
    return entries.filter((entry) => entry.status === selectedTab)
  }, [entries, selectedTab])

  // タブごとのエントリー数をカウント（バッジ表示用）
  const counts = useMemo(() => {
    const result = {
      all: entries.length,
      open: 0,
      closed: 0,
      canceled: 0
    };
    
    // 各ステータスのエントリー数をカウント
    entries.forEach(entry => {
      if (entry.status in result) {
        result[entry.status as keyof typeof result]++;
      }
    });
    
    return result;
  }, [entries]);

  return {
    selectedTab,
    setSelectedTab,
    filteredEntries,
    counts
  }
}

export default useHistoryTabs 