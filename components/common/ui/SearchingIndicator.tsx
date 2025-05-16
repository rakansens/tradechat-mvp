// components/common/ui/SearchingIndicator.tsx
// 作成: 検索およびロード状態表示用のインジケーター
// 改良: より洗練されたアニメーションとフィードバック
// 移動: components/chat/ui/から共通UIコンポーネントへ移動
// 更新: 2025-06-29 - 接続状態に応じた表示を追加

import { memo } from "react"
import { Loader2, RefreshCcw, WifiOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TypingIndicator } from "./TypingIndicator"
import { cn } from "@/lib/utils"
import type { ConnectionInfo } from "@/types/chat"

interface SearchingIndicatorProps {
  isSearching?: boolean
  isThinking?: boolean
  className?: string
  connection?: ConnectionInfo
}

export const SearchingIndicator = memo(({
  isSearching = false,
  isThinking = false,
  connection,
  className
}: SearchingIndicatorProps) => {
  // 何も表示しない
  if (!isSearching && !isThinking && 
      (!connection || (connection.status !== 'RECONNECTING' && connection.status !== 'ERROR'))) {
    return null;
  }
  
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
        {connection?.status === 'RECONNECTING' ? (
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4 animate-spin text-amber-500" />
            <span className="text-sm text-muted-foreground">再接続中...</span>
          </div>
        ) : connection?.status === 'ERROR' ? (
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">接続エラー: {connection.error || '通信エラーが発生しました'}</span>
          </div>
        ) : isSearching ? (
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