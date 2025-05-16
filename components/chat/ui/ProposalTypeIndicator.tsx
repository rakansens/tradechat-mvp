// components/chat/ui/ProposalTypeIndicator.tsx
// 作成: トレード提案種類を表示するインジケーター
// 移行: ChatWindow.tsxから分離
// 更新: 2025-06-28 - theme.accent参照をTailwindクラスに変更

import { ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProposalType } from "@/types/chat"

interface ProposalTypeIndicatorProps {
  type: ProposalType | undefined
}

export const ProposalTypeIndicator = ({ type }: ProposalTypeIndicatorProps) => {
  if (!type) return null

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "inline-flex items-center text-xs font-medium mb-2",
        type === "buy" 
          ? "text-accent-green border-accent-green bg-accent-green/10" 
          : "text-accent-red border-accent-red bg-accent-red/10"
      )}
    >
      {type === "buy" ? (
        <>
          <ArrowUp className="mr-1 h-3 w-3" />
          買いエントリー提案
        </>
      ) : (
        <>
          <ArrowDown className="mr-1 h-3 w-3" />
          売りエントリー提案
        </>
      )}
    </Badge>
  )
}
