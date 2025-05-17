import { useEffect, useRef } from 'react'
import { useRootStore } from '@/store'
import type { ExtendedMessage } from '@/types/chat/base'

/**
 * Manage streaming assistant messages.
 * Adds or updates a temporary message while the response is streaming.
 */
export function useStreamingMessages(
  isLoading: boolean,
  messages: ExtendedMessage[]
) {
  const streamingMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        if (!streamingMessageIdRef.current) {
          streamingMessageIdRef.current = `streaming-${Date.now()}`
          const streamingMessage: ExtendedMessage = {
            id: streamingMessageIdRef.current,
            role: 'assistant',
            content: lastMessage.content,
            isStreaming: true,
          }
          useRootStore.getState().addMessage(streamingMessage)
        } else {
          useRootStore.getState().updateMessage(streamingMessageIdRef.current, {
            content: lastMessage.content,
            isStreaming: true,
          })
        }
      }
    } else if (!isLoading && streamingMessageIdRef.current) {
      useRootStore.getState().updateMessage(streamingMessageIdRef.current, {
        isStreaming: false,
      })
      streamingMessageIdRef.current = null
    }
  }, [isLoading, messages])
}
