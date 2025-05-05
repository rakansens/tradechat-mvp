// components/chat/ui/TypingIndicator.tsx
// 作成: AIの応答生成中を示すタイピングインジケーター
// 「AIが考え中」を表現する動くドットアニメーション

import { memo } from "react"
import { cn } from "@/lib/utils"

interface TypingIndicatorProps {
  className?: string
}

export const TypingIndicator = memo(({ className }: TypingIndicatorProps) => {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <div className="text-sm text-muted-foreground mr-2">AI応答を生成中</div>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "h-2 w-2 rounded-full bg-primary/70",
              "animate-bounce",
              i === 1 && "animation-delay-200",
              i === 2 && "animation-delay-400"
            )}
            style={{
              animationDuration: "1s",
              animationIterationCount: "infinite",
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>
    </div>
  )
})

TypingIndicator.displayName = "TypingIndicator"
