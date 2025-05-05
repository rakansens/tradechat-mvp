// components/chat/ui/ProposalTypeIndicator.tsx
// 作成: トレード提案種類を表示するインジケーター
// 移行: ChatWindow.tsxから分離

import { ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ProposalType } from "@/types/chat"
import { theme } from "@/styles/colors"

interface ProposalTypeIndicatorProps {
  type: ProposalType | undefined
}

export const ProposalTypeIndicator = ({ type }: ProposalTypeIndicatorProps) => {
  if (!type) return null

  return (
    <Badge 
      variant="outline" 
      className="inline-flex items-center text-xs font-medium mb-2"
      style={{
        color: type === "buy" ? theme.accent.green : theme.accent.red,
        borderColor: type === "buy" ? theme.accent.green : theme.accent.red,
        background: `${type === "buy" ? theme.accent.green : theme.accent.red}20`
      }}
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
