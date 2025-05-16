/**
 * components/position/history/ui/EntryList.tsx
 * 
 * エントリーリストを表示するコンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 */

"use client"

import { ScrollArea } from "@/components/ui/scroll-area"

import type { Entry } from "@/types/entry"
import EntryCard from "./EntryCard"

interface EntryListProps {
  entries: Entry[]
  getCurrentPrice: (price: number) => number
  onClosePosition: (entry: Entry) => void
  onCancelPosition: (entryId: string) => void
  maxHeight?: string | number
}

/**
 * エントリーリストを表示するコンポーネント
 * 
 * @param entries 表示するエントリー配列
 * @param getCurrentPrice 現在価格を取得する関数
 * @param onClosePosition ポジションクローズのコールバック
 * @param onCancelPosition ポジションキャンセルのコールバック
 * @param maxHeight リストの最大高さ（デフォルト: "400px"）
 */
export function EntryList({
  entries,
  getCurrentPrice,
  onClosePosition,
  onCancelPosition,
  maxHeight = "400px"
}: EntryListProps) {
  // エントリーが空の場合
  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center p-6 text-sm text-text-muted bg-background-card"
        style={{ 
          minHeight: "200px"
        }}
      >
        表示するエントリーがありません
      </div>
    )
  }

  return (
    <ScrollArea style={{ maxHeight }} className="pr-3">
      <div className="p-3 space-y-2 bg-background-card">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            currentPrice={getCurrentPrice(entry.price)}
            onClose={() => onClosePosition(entry)}
            onCancel={() => onCancelPosition(entry.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

export default EntryList 