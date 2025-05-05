// components/chat/ChatWindow.tsx
// 更新: ChatGPTスタイルのモダンUIに改善
// 更新: 分割コンポーネントアーキテクチャの採用
// 更新: パフォーマンス最適化とアクセシビリティ強化
// 更新: 型安全性の向上
"use client"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { forwardRef } from "react"
import type { OpenEntry } from "@/types/entry"
import type { ExtendedMessage } from "@/types/chat"
import type { MessageDisplayProps, TradeActionProps } from "@/types/common-interfaces"
import { cn } from "@/lib/utils"

// 新しい分割コンポーネントをインポート
import { ChatMessage } from "./messages/ChatMessage"
import { ScrollDownButton } from "./ui/ScrollDownButton"
import { SearchingIndicator } from "./ui/SearchingIndicator"

// 状態を詳細化した拡張プロップスインターフェース
interface ChatWindowProps extends MessageDisplayProps, Pick<TradeActionProps, 'onExecuteEntry'> {
  pendingEntry?: OpenEntry | null
  // 状態の詳細化: isSearchingを分離
  isLoading?: boolean  // データ取得中
  isThinking?: boolean // AI応答生成中
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ 
    messages, 
    isSearching = false, 
    isLoading = false,
    isThinking = false,
    onExecuteEntry, 
    pendingEntry 
  }, ref) => {
    // 自動スクロール用の参照
    const containerRef = useRef<HTMLDivElement>(null)
    const [showScrollButton, setShowScrollButton] = useState(false)
    
    // スクロール関数 - useCallbackで最適化
    const scrollToBottom = useCallback(() => {
      const chatContainer = containerRef.current
      if (!chatContainer) return
      
      const scrollHeight = chatContainer.scrollHeight
      const clientHeight = chatContainer.clientHeight
      
      // Intersection Observerを使用したスムーズスクロール
      try {
        chatContainer.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: "smooth"
        })
      } catch (e) {
        // フォールバック: 直接スクロール位置を設定
        chatContainer.scrollTop = scrollHeight
      }
    }, [])
    
    // メッセージが変更されたときに自動スクロール
    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom()
      }
    }, [messages, scrollToBottom])
    
    // スクロール位置を監視して「下へスクロール」ボタンの表示を制御
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      // スクロール位置が下端から一定距離以上離れている場合にボタンを表示
      const bottomThreshold = 150
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold
      setShowScrollButton(!isNearBottom)
    }, [])
    
    // ResizeObserverの設定 - レスポンシブ対応を強化
    useEffect(() => {
      const container = containerRef.current
      if (!container) return
      
      const resizeObserver = new ResizeObserver(() => {
        // ウィンドウサイズ変更時にスクロール位置を調整
        if (!showScrollButton) {
          scrollToBottom()
        }
      })
      
      resizeObserver.observe(container)
      return () => resizeObserver.disconnect()
    }, [scrollToBottom, showScrollButton])
    
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 pb-0 relative" 
        style={{ 
          scrollBehavior: 'smooth',
          height: '100%'
        }}
        onScroll={handleScroll}
      >
        {/* チャットメッセージのコンテナ */}
        <div className="flex flex-col space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLastMessage={index === messages.length - 1}
              pendingEntry={pendingEntry}
              onExecuteEntry={onExecuteEntry}
            />
          ))}
        </div>
        
        {/* 状態インジケーター - ローディングとAI応答生成の分離 */}
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
