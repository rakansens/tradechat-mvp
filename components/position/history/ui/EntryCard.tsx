/**
 * components/position/history/ui/EntryCard.tsx
 * 
 * 各ポジションエントリーを表示するカードコンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 * - 2025-06-28: インラインスタイルをTailwindクラスに変更
 */

"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatPrice, formatDate } from "@/utils/formatUtils"
import type { Entry } from "@/types/entry"

interface EntryCardProps {
  entry: Entry
  currentPrice: number
  onClose: () => void
  onCancel: () => void
}

/**
 * 各ポジションエントリーを表示するカードコンポーネント
 * 
 * @param entry エントリー情報
 * @param currentPrice 現在の価格
 * @param onClose クローズアクションのコールバック
 * @param onCancel キャンセルアクションのコールバック
 */
export function EntryCard({ entry, currentPrice, onClose, onCancel }: EntryCardProps) {
  // 利益/損失の計算
  const pnl = useMemo(() => {
    if (entry.status === "closed" && 'exitPrice' in entry) {
      // クローズされたポジションは確定利益/損失を表示
      return (entry.exitPrice - entry.price)
    } else {
      // オープンポジションは現在価格に基づく暫定利益/損失
      return (currentPrice - entry.price)
    }
  }, [entry, currentPrice])

  return (
    <Card className="mb-2 last:mb-0 overflow-hidden border border-border-light">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium text-text-primary">
              {entry.symbol}
              <Badge 
                className={cn(
                  "ml-2 text-xs text-text-primary",
                  entry.status === "open" ? "bg-background-tertiary" : "bg-background-elevated"
                )}
              >
                {entry.status === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="text-sm mt-1 text-text-secondary">
              Entry: {formatPrice(entry.price)}
              {entry.status === "closed" && 'exitPrice' in entry && (
                <span className="ml-2">
                  Exit: {formatPrice(entry.exitPrice)}
                </span>
              )}
            </div>
            
            <div className="text-xs mt-1 text-text-muted">
              {formatDate(entry.time)}
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              "font-medium",
              pnl >= 0 ? "text-accent-green" : "text-accent-red"
            )}>
              {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
            </div>
            
            <div className="text-sm mt-1 text-text-secondary">
              {entry.side} {entry.symbol}
            </div>
            
            {entry.status === "open" && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1 text-xs rounded bg-accent-blue text-white"
                >
                  Close
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-xs rounded bg-background-tertiary text-text-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EntryCard 