// components/chat/ui/MessageActions.tsx
// 作成: メッセージ操作用UIコンポーネント
// ユーザーがメッセージに対して行える操作（コピーなど）を提供
// 更新: 2025-05-21 - conversationIdプロパティを追加
// 更新: 2025-06-25 - ConversationContextを使用するよう変更
// 更新: 2025-06-26 - モバイルデバイスでのlong-press対応を追加

import { useState, memo, useEffect, useRef } from "react"
import { Copy, Check, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExtendedMessage } from "@/types/chat/base"
import { useConversation } from "@/contexts/ConversationContext"
import { useLongPress } from "@/hooks/ui/useLongPress"

interface MessageActionsProps {
  message: ExtendedMessage
  isVisible: boolean
}

export const MessageActions = memo(({ message, isVisible }: MessageActionsProps) => {
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const { conversationId } = useConversation()
  const actionRef = useRef<HTMLDivElement>(null)
  
  // モバイルデバイスの判定
  useEffect(() => {
    // matchMediaを使ってhoverが利用可能かどうかを判定
    const mediaQuery = window.matchMedia('(hover: none)');
    setIsMobile(mediaQuery.matches);
    
    // 画面サイズやメディア状態が変化した場合に再評価
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  // 長押し検出のハンドラ
  const handleLongPress = () => {
    setIsMenuVisible(true);
  };
  
  // long-pressハンドラを設定
  const longPressHandlers = useLongPress(handleLongPress, {
    delay: 500,
    preventDefault: true
  });
  
  // メニュー外のクリックを検出してメニューを閉じる
  useEffect(() => {
    if (!isMobile || !isMenuVisible) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setIsMenuVisible(false);
      }
    };
    
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isMobile, isMenuVisible]);
  
  // メッセージ内容をクリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      
      // モバイルの場合はメニューを閉じる
      if (isMobile) {
        setIsMenuVisible(false);
      }
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
    
    // モバイルの場合はメニューを閉じる
    if (isMobile) {
      setIsMenuVisible(false);
    }
  }
  
  // PC/モバイル共通のメニュー表示条件
  const showMenu = isMobile ? isMenuVisible : isVisible;
  
  return (
    <div 
      ref={actionRef}
      className={cn(
        "absolute -top-2 right-2 flex items-center gap-1 rounded-md bg-background/80 backdrop-blur transition-opacity",
        showMenu ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      // モバイルの場合はlong-pressイベントハンドラを追加
      {...(isMobile ? longPressHandlers : {})}
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
