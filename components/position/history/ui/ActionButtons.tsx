/**
 * components/position/history/ui/ActionButtons.tsx
 * 
 * ポジションのアクションボタン（クローズ・キャンセル）コンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 * - 2025-06-28: theme.accent参照とインラインスタイルをTailwindクラスに変更
 */

"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"
import type { Entry } from "@/types/entry"

interface ActionButtonsProps {
  entry: Entry
  onClose: () => void
  onCancel: () => void
}

/**
 * ポジションのアクションボタン（クローズ・キャンセル）コンポーネント
 * 
 * @param entry ポジションエントリー
 * @param onClose クローズアクションのコールバック
 * @param onCancel キャンセルアクションのコールバック
 */
export function ActionButtons({ entry, onClose, onCancel }: ActionButtonsProps) {
  // クローズド状態のエントリーにはボタンを表示しない
  if (entry.status !== "open") {
    return null
  }

  return (
    <div className="flex gap-2 justify-end mt-2">
      <Button
        variant="outline"
        size="sm"
        className="text-xs bg-background-tertiary border-border-light text-text-secondary"
        onClick={onCancel}
      >
        <X className="h-3 w-3 mr-1" /> Cancel
      </Button>
      <Button
        size="sm"
        className="text-xs bg-accent-blue text-white"
        onClick={onClose}
      >
        <CheckCircle className="h-3 w-3 mr-1" /> Close
      </Button>
    </div>
  )
}

export default ActionButtons 