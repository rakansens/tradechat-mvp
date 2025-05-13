// components/chat/messages/ChatMessage.tsx
// 更新: パフォーマンス最適化のためのリファクタリング
// 静的要素の定数化とコンポーネントの分割を行いました
// 更新: 2025-05-21 - conversationIdプロパティを追加

import { useState, memo, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ExtendedMessage } from "@/types/chat"
import { MessageContent } from "./MessageContent"
import { MessageActions } from "../ui/MessageActions"
import { ProposalTypeIndicator } from "../ui/ProposalTypeIndicator"
import { ProposalDetails } from "../ui/ProposalDetails"
import type { OpenEntry } from "@/types/entry"

// 定数化した静的要素
const USER_BUBBLE_STYLE = "bg-[#E9F2FF] text-primary-foreground dark:bg-blue-700"
const AI_BUBBLE_STYLE = "bg-[#F7F7F8] text-foreground dark:bg-gray-800"
const PROPOSAL_BUBBLE_STYLE = "bg-gradient-to-r from-card to-card/80 border-primary/20 border"
const AVATAR_SIZE_STYLE = "h-8 w-8 flex-shrink-0"

// メモ化されたアバターコンポーネント
const UserAvatar = memo(() => (
  <Avatar className={AVATAR_SIZE_STYLE}>
    <AvatarFallback>U</AvatarFallback>
    <AvatarImage src="/user-avatar.png" />
  </Avatar>
))
UserAvatar.displayName = "UserAvatar"

const AIAvatar = memo(() => (
  <Avatar className={AVATAR_SIZE_STYLE}>
    <AvatarFallback>AI</AvatarFallback>
    <AvatarImage src="/abstract-ai-network.png" />
  </Avatar>
))
AIAvatar.displayName = "AIAvatar"

interface ChatMessageProps {
  message: ExtendedMessage
  pendingEntry?: OpenEntry | null
  executeEntry?: () => void
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
  conversationId?: string | null // 追加: 会話ID
}

interface MessageBubbleProps {
  isUser: boolean
  isProposal: boolean
  isHovering: boolean
  children: React.ReactNode
}

// メッセージバブルコンポーネント
const MessageBubble = memo(({ isUser, isProposal, isHovering, children }: MessageBubbleProps) => {
  // バブルのスタイルをメモ化
  const bubbleStyle = useMemo(() => {
    return cn(
      "group relative flex max-w-[85%] flex-col rounded-lg px-3 py-2",
      isUser ? USER_BUBBLE_STYLE : AI_BUBBLE_STYLE,
      isProposal ? PROPOSAL_BUBBLE_STYLE : ""
    )
  }, [isUser, isProposal])
  
  return (
    <div className={bubbleStyle}>
      {children}
    </div>
  )
})
MessageBubble.displayName = "MessageBubble"

export const ChatMessage = memo(({ 
  message, 
  pendingEntry,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry,
  conversationId // 追加: 会話ID
}: ChatMessageProps) => {
  const [isHovering, setIsHovering] = useState(false)
  
  // メッセージのプロパティをメモ化
  const { isUser, isProposal, proposalType, price, isStreaming } = useMemo(() => ({
    isUser: message.role === "user",
    isProposal: !!message.isProposal,
    proposalType: message.proposalType,
    price: message.price,
    isStreaming: !!message.isStreaming
  }), [message])
  
  // コンテナスタイルをメモ化
  const containerStyle = useMemo(() => {
    return cn(
      "flex w-full items-start gap-2 py-4",
      isUser ? "justify-end" : "justify-start"
    )
  }, [isUser])

  return (
    <div 
      className={containerStyle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {!isUser && <AIAvatar />}

      <MessageBubble isUser={isUser} isProposal={isProposal} isHovering={isHovering}>
        {isProposal && proposalType && (
          <ProposalTypeIndicator type={proposalType} />
        )}

        <MessageContent message={message} isStreaming={isStreaming} />

        {/* Actions menu appears on hover */}
        <MessageActions 
          message={message} 
          isVisible={isHovering}
          conversationId={conversationId} // 追加: 会話ID
        />

        {/* Proposal action buttons */}
        {isProposal && proposalType && price && (
          <ProposalDetails
            price={price}
            proposalType={proposalType}
            isLastMessage={true} // VirtualMessageListで全てのメッセージがレンダリングされるため、最後かどうかは必要に応じて別で判定します
            pendingEntry={pendingEntry || null}
            onExecuteEntry={executeEntry}
            onEditEntry={editPendingEntry}
            onCancelEntry={cancelPendingEntry}
          />
        )}
      </MessageBubble>

      {isUser && <UserAvatar />}
    </div>
  )
})

ChatMessage.displayName = "ChatMessage"
