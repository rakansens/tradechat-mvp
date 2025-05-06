// components/chat/ChatWindow.tsx
// 更新: セレクタパターンを一貫して適用するように修正
// 更新: 内部でメモ化されたセレクタを使用するように変更

"use client"

import { useState, useRef, forwardRef, memo, useCallback } from "react"
import { 
  useChatStore, 
  useEntryStore,
  // メモ化されたセレクター
  selectMessages,
  selectMessagesWithStreaming,
  selectIsSearching,
  selectPendingEntry,
  selectStreamingMessage
} from "@/store"
import type { OpenEntry } from "@/types/entry"
import type { ExtendedMessage } from "@/types/chat"
import type { TradeActionProps } from "@/types/common-interfaces"

// 最適化されたメッセージリストコンポーネントをインポート
import { MessageList } from "./VirtualMessageList"
import { ScrollDownButton } from "./ui/ScrollDownButton"
import { SearchingIndicator } from "./ui/SearchingIndicator"

// シンプル化されたインターフェース
interface ChatWindowProps extends Pick<TradeActionProps, 'onExecuteEntry'> {
  ref?: React.Ref<HTMLDivElement>
  isThinking?: boolean
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ 
    isThinking = false,
    onExecuteEntry, 
    editPendingEntry,
    cancelPendingEntry
  }, ref) => {
    // メモ化されたセレクターを使用してデータを取得
    const messages = useChatStore(selectMessagesWithStreaming);
    const isSearching = useChatStore(selectIsSearching);
    const pendingEntry = useEntryStore(selectPendingEntry);
    const streamingMessage = useChatStore(selectStreamingMessage);
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
        
        {/* 状態インジケーター - ストリーミングメッセージがない場合のみ表示 */}
        {!streamingMessage && (
          <SearchingIndicator
            isSearching={isSearching}
            isThinking={isThinking}
          />
        )}
        
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
