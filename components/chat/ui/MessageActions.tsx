// components/chat/ui/MessageActions.tsx
// 作成: メッセージ操作用UIコンポーネント
// ユーザーがメッセージに対して行える操作（コピーなど）を提供
// 更新: 2025-05-21 - conversationIdプロパティを追加

import { useState, memo } from "react"
import { Copy, Check, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtendedMessage } from "@/types/chat"

interface MessageActionsProps {
  message: ExtendedMessage
  isVisible: boolean
  conversationId?: string | null // 追加: 会話ID
}

export const MessageActions = memo(({ message, isVisible, conversationId }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false)
  
  // メッセージ内容をクリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err)
    }
  }
  
  // Markdownとしてメッセージを保存
  const saveAsMarkdown = () => {
    // ファイル名に会話IDを含める
    const fileName = conversationId 
      ? `message-${conversationId.substring(0, 8)}-${new Date().toISOString().split("T")[0]}.md`
      : `message-${new Date().toISOString().split("T")[0]}.md`;
      
    const blob = new Blob([message.content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    
    // クリーンアップ
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  return (
    <div 
      className={cn(
        "absolute -top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur transition-opacity",
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <button
        onClick={copyToClipboard}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        aria-label="メッセージをコピー"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      <button
        onClick={saveAsMarkdown}
        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
        aria-label="Markdownとして保存"
      >
        <Download className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  )
})

MessageActions.displayName = "MessageActions"
