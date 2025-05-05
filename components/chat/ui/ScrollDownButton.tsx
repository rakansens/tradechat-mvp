// components/chat/ui/ScrollDownButton.tsx
// 作成: スクロールダウンボタンコンポーネント
// 長いチャット履歴で最新メッセージにジャンプするための機能

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ScrollDownButtonProps {
  onClick: () => void
  isVisible: boolean
  className?: string
}

export const ScrollDownButton = ({
  onClick,
  isVisible,
  className
}: ScrollDownButtonProps) => {
  return (
    <Button
      variant="secondary"
      size="icon"
      className={cn(
        "fixed bottom-20 right-4 z-10 h-8 w-8 rounded-full shadow-md transition-opacity",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={onClick}
      aria-label="最新のメッセージへスクロール"
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  )
}
