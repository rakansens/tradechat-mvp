/**
 * components/position/history/ui/EntryCard.tsx
 * 
 * 各ポジションエントリーを表示するカードコンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 */

"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { theme } from "@/styles/colors"
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

  // PnLのスタイル（正ならプラス、負ならマイナス）
  const pnlColor = pnl >= 0 ? theme.accent.green : theme.accent.red

  return (
    <Card className="mb-2 last:mb-0 overflow-hidden border" style={{ borderColor: theme.border.light }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium" style={{ color: theme.text.primary }}>
              {entry.symbol}
              <Badge 
                className="ml-2 text-xs" 
                style={{ 
                  backgroundColor: entry.status === "open" ? theme.background.tertiary : theme.background.elevated,
                  color: theme.text.primary
                }}
              >
                {entry.status === "open" ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              Entry: {formatPrice(entry.price)}
              {entry.status === "closed" && 'exitPrice' in entry && (
                <span className="ml-2">
                  Exit: {formatPrice(entry.exitPrice)}
                </span>
              )}
            </div>
            
            <div className="text-xs mt-1" style={{ color: theme.text.muted }}>
              {formatDate(entry.time)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-medium" style={{ color: pnlColor }}>
              {pnl >= 0 ? "+" : ""}{formatPrice(pnl)}
            </div>
            
            <div className="text-sm mt-1" style={{ color: theme.text.secondary }}>
              {entry.side} {entry.symbol}
            </div>
            
            {entry.status === "open" && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1 text-xs rounded"
                  style={{ backgroundColor: theme.accent.blue, color: "#ffffff" }}
                >
                  Close
                </button>
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-xs rounded"
                  style={{ backgroundColor: theme.background.tertiary, color: theme.text.secondary }}
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