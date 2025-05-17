"use client"

import React, { memo, useEffect, useRef, useState } from "react"
import { VariableSizeList as List } from "react-window"
import { ChatMessage } from "@/components/chat/messages/ChatMessage"
import { OpenEntry } from "@/types/entry"
import { ExtendedMessage } from "@/types/chat/base"

interface MessageListProps {
  messages: ExtendedMessage[]
  pendingEntry: OpenEntry | null
  chatEndRef: React.RefObject<HTMLDivElement>
  executeEntry?: () => void
  editPendingEntry?: (entry: OpenEntry) => void
  cancelPendingEntry?: () => void
}

const MemoizedChatMessage = memo(
  ({
    message,
    pendingEntry,
    executeEntry,
    editPendingEntry,
    cancelPendingEntry,
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
  )
)
MemoizedChatMessage.displayName = "MemoizedChatMessage"

export function MessageList({
  messages,
  pendingEntry,
  chatEndRef,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry,
}: MessageListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<List>(null)
  const sizeMap = useRef<Record<number, number>>({})
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      if (scrollContainerRef.current) {
        setHeight(scrollContainerRef.current.clientHeight)
      }
    }
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  useEffect(() => {
    listRef.current?.scrollToItem(messages.length - 1)
  }, [messages])

  const getItemSize = (index: number) => sizeMap.current[index] ?? 80

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.getBoundingClientRect().height
        if (sizeMap.current[index] !== height) {
          sizeMap.current[index] = height
          listRef.current?.resetAfterIndex(index)
        }
      }
    }, [messages[index]])

    const message = messages[index]
    return (
      <div style={style} ref={rowRef} className="pb-4">
        <MemoizedChatMessage
          message={message}
          pendingEntry={pendingEntry}
          executeEntry={executeEntry}
          editPendingEntry={editPendingEntry}
          cancelPendingEntry={cancelPendingEntry}
        />
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden py-4">
      {height > 0 && (
        <List
          height={height}
          width="100%"
          itemCount={messages.length}
          itemSize={getItemSize}
          ref={listRef}
          overscanCount={5}
        >
          {Row}
        </List>
      )}
      {/* sentinel for compatibility */}
      <div ref={chatEndRef} style={{ height: 0 }} />
    </div>
  )
}
