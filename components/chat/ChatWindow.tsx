// components/chat/ChatWindow.tsx
// 更新: 最適化されたメッセージリストコンポーネントを統合
// 更新: スクロール管理を組み込みコンポーネントに委任
// 更新: パフォーマンス最適化とコードシンプル化

"use client"

import { useState, useRef, forwardRef } from "react"
import type { OpenEntry } from "@/types/entry"
import type { ExtendedMessage } from "@/types/chat"
import type { MessageDisplayProps, TradeActionProps } from "@/types/common-interfaces"

// 最適化されたメッセージリストコンポーネントをインポート
import { MessageList } from "./VirtualMessageList"
import { ScrollDownButton } from "./ui/ScrollDownButton"
import { SearchingIndicator } from "./ui/SearchingIndicator"

// シンプル化されたインターフェース
interface ChatWindowProps extends MessageDisplayProps, Pick<TradeActionProps, 'onExecuteEntry'> {
  pendingEntry?: OpenEntry | null
  isSearching?: boolean
  isLoading?: boolean
  isThinking?: boolean
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ 
    messages, 
    isSearching = false, 
    isLoading = false,
    isThinking = false,
    onExecuteEntry, 
    pendingEntry,
    editPendingEntry,
    cancelPendingEntry
  }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    
    // スクロール位置変更ハンドラー
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      // 下端からの距離を計算
      const bottomThreshold = 150
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold
      setShowScrollButton(!isNearBottom)
    }
    
    // 下端までスクロールする関数
    const scrollToBottom = () => {
      if (!containerRef.current) return
      
      try {
        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth"
        })
      } catch (e) {
        // フォールバック
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight
        }
      }
    }
    
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 pb-0 relative" 
        style={{ scrollBehavior: 'smooth', height: '100%' }}
        onScroll={handleScroll}
      >
        {/* 最適化されたメッセージリストコンポーネント */}
        <MessageList
          messages={messages}
          pendingEntry={pendingEntry || null}
          chatEndRef={ref as React.RefObject<HTMLDivElement>}
          executeEntry={onExecuteEntry}
          editPendingEntry={editPendingEntry}
          cancelPendingEntry={cancelPendingEntry}
        />
        
        {/* 状態インジケーター */}
        <SearchingIndicator 
          isSearching={isSearching || isLoading} 
          isThinking={isThinking}
        />
        
        {/* スクロールダウンボタン */}
        <ScrollDownButton 
          onClick={scrollToBottom} 
          isVisible={showScrollButton} 
        />
      </div>
    )
  }
)

ChatWindow.displayName = "ChatWindow"

export default ChatWindow
