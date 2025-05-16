// components/chat/VirtualMessageList.tsx
// 更新: メッセージリスト表示用の最適化されたコンポーネント
// 更新: ExtendedMessage型を使用するように変更
// 更新: 2025-05-21 - conversationIdプロパティを追加
// 更新: 2025-06-25 - ConversationContextを使用するよう変更、conversationIdプロパティ削除

"use client"

import React, { useRef, useEffect, memo } from "react"
import { ChatMessage } from "@/components/chat/messages/ChatMessage"
import { OpenEntry } from "@/types/entry"
import { ExtendedMessage } from "@/types/chat"

interface MessageListProps {
  messages: ExtendedMessage[]
  pendingEntry: OpenEntry | null
  chatEndRef: React.RefObject<HTMLDivElement>
  executeEntry?: () => void
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
}

// 個別メッセージをメモ化して不要な再レンダリングを防止
const MemoizedChatMessage = memo(({ 
  message, 
  pendingEntry, 
  executeEntry, 
  editPendingEntry, 
  cancelPendingEntry
}: {
  message: ExtendedMessage
  pendingEntry: OpenEntry | null
  executeEntry?: () => void
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
}) => (
  <ChatMessage
    message={message}
    pendingEntry={pendingEntry}
    executeEntry={executeEntry}
    editPendingEntry={editPendingEntry}
    cancelPendingEntry={cancelPendingEntry}
  />
))
MemoizedChatMessage.displayName = "MemoizedChatMessage"

export function MessageList({
  messages,
  pendingEntry,
  chatEndRef,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry
}: MessageListProps) {
  // 親コンテナのref
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // メッセージが変更されたらスクロール位置を調整
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatEndRef]);
  
  return (
    <div 
      ref={scrollContainerRef} 
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
    >
      <div className="space-y-4">
        {messages.map((message) => (
          <MemoizedChatMessage
            key={message.id}
            message={message}
            pendingEntry={pendingEntry}
            executeEntry={executeEntry}
            editPendingEntry={editPendingEntry}
            cancelPendingEntry={cancelPendingEntry}
          />
        ))}
      </div>
      
      {/* スクロール位置を最下部に調整するための空のdiv */}
      <div ref={chatEndRef} />
    </div>
  )
}
