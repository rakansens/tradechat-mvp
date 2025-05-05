// components/chat/messages/ChatMessage.tsx
// 作成: 個別メッセージ表示用コンポーネント
// モダンなチャットUIスタイルに準拠したメッセージバブルの実装

import { useState, memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ExtendedMessage } from "@/types/chat"
import { MessageContent } from "./MessageContent"
import { MessageActions } from "../ui/MessageActions"
import { ProposalTypeIndicator } from "../ui/ProposalTypeIndicator"
import { ProposalDetails } from "../ui/ProposalDetails"
import type { OpenEntry } from "@/types/entry"

interface ChatMessageProps {
  message: ExtendedMessage
  isLastMessage: boolean
  pendingEntry?: OpenEntry | null
  onExecuteEntry?: () => void
}

export const ChatMessage = memo(({ 
  message, 
  isLastMessage,
  pendingEntry,
  onExecuteEntry
}: ChatMessageProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const isUser = message.role === "user"
  const isProposal = message.isProposal
  const proposalType = message.proposalType
  const price = message.price

  return (
    <div 
      className={cn(
        "flex w-full items-start gap-2 py-4",
        isUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>AI</AvatarFallback>
          <AvatarImage src="/abstract-ai-network.png" />
        </Avatar>
      )}

      <div className={cn(
        "group relative flex max-w-[85%] flex-col rounded-lg px-3 py-2",
        isUser 
          ? "bg-[#E9F2FF] text-primary-foreground dark:bg-blue-700" 
          : "bg-[#F7F7F8] text-foreground dark:bg-gray-800",
        isProposal ? "bg-gradient-to-r from-card to-card/80 border-primary/20 border" : ""
      )}>
        {isProposal && proposalType && (
          <ProposalTypeIndicator type={proposalType} />
        )}

        <MessageContent message={message} />

        {/* Actions menu appears on hover */}
        <MessageActions 
          message={message} 
          isVisible={isHovering} 
        />

        {/* Proposal action buttons */}
        {isProposal && proposalType && price && (
          <ProposalDetails
            price={price}
            proposalType={proposalType}
            isLastMessage={isLastMessage}
            pendingEntry={pendingEntry || null}
            onExecuteEntry={onExecuteEntry}
          />
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>U</AvatarFallback>
          <AvatarImage src="/user-avatar.png" />
        </Avatar>
      )}
    </div>
  )
})

ChatMessage.displayName = "ChatMessage"
