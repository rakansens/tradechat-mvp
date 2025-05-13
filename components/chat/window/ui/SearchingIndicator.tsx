// components/chat/ui/SearchingIndicator.tsx
// 作成: 検索およびロード状態表示用のインジケーター
// 改良: より洗練されたアニメーションとフィードバック

import { memo } from "react"
import { Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TypingIndicator } from "./TypingIndicator"
import { cn } from "@/lib/utils"

interface SearchingIndicatorProps {
  isSearching?: boolean
  isThinking?: boolean
  className?: string
}

export const SearchingIndicator = memo(({
  isSearching = false,
  isThinking = false,
  className
}: SearchingIndicatorProps) => {
  // 何も表示しない
  if (!isSearching && !isThinking) return null
  
  return (
    <div className={cn(
      "flex items-start gap-2 py-4 animate-fadeIn",
      className
    )}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback>AI</AvatarFallback>
        <AvatarImage src="/abstract-ai-network.png" />
      </Avatar>
      
      <div className="bg-[#F7F7F8] dark:bg-gray-800 p-3 rounded-lg max-w-[85%]">
        {isSearching ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">データを取得中...</span>
          </div>
        ) : (
          <TypingIndicator />
        )}
      </div>
    </div>
  )
})

SearchingIndicator.displayName = "SearchingIndicator"
