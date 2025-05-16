// components/chat/ui/ProposalDetails.tsx
// 作成: トレード提案の詳細とアクション
// 移行: ChatWindow.tsxから分離、UI/UXを向上
// 更新: 2025-06-28 - Tailwindクラスに変更

import { useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ProposalType } from "@/types/chat"
import type { OpenEntry } from "@/types/entry"

interface ProposalDetailsProps {
  price: number
  proposalType: ProposalType | undefined
  isLastMessage: boolean
  pendingEntry: OpenEntry | null
  onExecuteEntry?: () => void
  onEditEntry?: (entry: OpenEntry) => void
  onCancelEntry?: () => void
}

export const ProposalDetails = ({
  price,
  proposalType,
  isLastMessage,
  pendingEntry,
  onExecuteEntry,
}: ProposalDetailsProps) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [actionComplete, setActionComplete] = useState(false)

  if (!proposalType) return null

  // エントリー実行処理
  const handleExecuteEntry = () => {
    if (!onExecuteEntry) return

    setActionInProgress(true)
    
    // ボタンのインタラクションフィードバック
    onExecuteEntry()
    
    // UIフィードバックを表示
    setTimeout(() => {
      setActionInProgress(false)
      setActionComplete(true)
      
      setTimeout(() => {
        setActionComplete(false)
      }, 2000)
    }, 1000)
  }

  // 提案が保留中かどうかを確認
  const isPending = pendingEntry && pendingEntry.price === price && 
                    pendingEntry.side.toLowerCase() === proposalType

  return (
    <div className="mt-2 text-sm">
      {/* 詳細表示トグルボタン */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setDetailsExpanded(!detailsExpanded)}
      >
        <span>詳細</span>
        <ChevronDown 
          className={`ml-1 h-3 w-3 transition-transform ${detailsExpanded ? 'rotate-180' : ''}`} 
        />
      </Button>

      {/* 展開時の詳細情報 */}
      {detailsExpanded && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted">
          <p>
            価格: <span className="font-medium">{price.toLocaleString()}</span>
          </p>
          {proposalType === "buy" ? (
            <p>方向: <span className="text-green-600 dark:text-green-400">買い</span></p>
          ) : (
            <p>方向: <span className="text-red-600 dark:text-red-400">売り</span></p>
          )}
        </div>
      )}

      {/* アクションボタン - 最新のメッセージの場合のみ表示 */}
      {isLastMessage && onExecuteEntry && !isPending && (
        <div className="mt-3">
          <Button
            onClick={handleExecuteEntry}
            disabled={actionInProgress || actionComplete}
            size="sm"
            className={cn(
              "text-white",
              proposalType === "buy" ? "bg-accent-green hover:bg-accent-green/90" : "bg-accent-red hover:bg-accent-red/90"
            )}
          >
            {actionInProgress && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {actionComplete && (
              <Check className="mr-2 h-4 w-4" />
            )}
            {proposalType === "buy" ? "買いエントリーを実行" : "売りエントリーを実行"}
          </Button>
        </div>
      )}

      {/* 保留中の場合のメッセージ */}
      {isPending && (
        <div className="mt-3">
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            このエントリーは実行待ちです
          </div>
        </div>
      )}
    </div>
  )
}
