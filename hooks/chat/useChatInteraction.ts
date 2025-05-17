/**
 * hooks/chat/useChatInteraction.ts
 * 
 * チャットインタラクションを管理するカスタムフック
 * AIチャットとのインタラクション、提案の処理、エントリー操作を管理します
 * 
 * 変更履歴:
 * - 2023-05-10: 初期実装
 * - 2023-05-12: Message型をExtendedMessage型に置き換えて型エラーを修正
 * - 2023-06-05: メモ化されたセレクタを使用するように更新
 * - 2023-09-20: ストリーミングテキスト表示のためのリアルタイム更新機能を追加
 * - 2023-10-15: ストリーミングメッセージの処理を改善し、isStreaming フラグを設定
 * - 2024-01-10: any型キャストを具体的な型に置き換えて型安全性を向上
 * - 2024-05-14: useChatStoreをuseRootStoreに変更
 * - 2024-05-15: useEntryStoreを削除し、すべてのエントリー処理をpropsから受け取るように変更
 * - 2025-05-14: フックのリファクタリングに伴いhooks/chatディレクトリに移動
 * - 2025-05-20: 会話ID(conversationId)とシステムプロンプト(system_prompt)のサポートを追加
 * - 2025-06-01: OpenEntry型にuserIdプロパティを追加して型エラーを解消
 */

"use client"

import { useState, useEffect } from "react"
import { useChat } from "ai/react"
import type { Entry, OpenEntry } from "@/types/entry"
import type { ExtendedMessage } from "@/types/chat/base"
import type { ChangeEvent, FormEvent } from "react"
import type { Message } from "ai"
import { v4 } from "uuid"
import { useStreamingMessages } from "./useStreamingMessages"
import { useSampleResponses } from "./useSampleResponses"
import { useEntryManager } from "./useEntryManager"
import { getCurrentUserId } from "./utils"

interface UseChatInteractionProps {
  ohlcData?: any[]
  pendingEntry?: Entry | null
  setPendingEntry?: (entry: OpenEntry | null) => void
  entries?: Entry[]
  executeEntry?: () => void
  setActiveTab?: (tab: string) => void
  // 追加: 会話IDとシステムプロンプト
  conversationId?: string
  system_prompt?: string
}

export function useChatInteraction({
  ohlcData = [],
  pendingEntry = null,
  setPendingEntry = () => {},
  entries = [],
  executeEntry = () => {},
  setActiveTab = () => {},
  // 追加: 会話IDとシステムプロンプト
  conversationId,
  system_prompt,
}: UseChatInteractionProps) {
  const [isSearching, setIsSearching] = useState(false)

  // Initialize sample conversations
  const initialMessages: ExtendedMessage[] = [
    {
      id: "welcome",
      role: "assistant" as const,
      content: "Welcome to AlphaTrader! I'm your AI trading assistant. How can I help you analyze the market today?",
    },
    {
      id: "ai-proposal-1",
      role: "assistant" as const,
      content: `I've analyzed the Bitcoin chart and detected a potential buy signal.

Technical Analysis:
• Price has broken above the 50-day moving average
• Recent higher highs and higher lows
• Volume is trending upward

Would you like to enter a long position at the current price of $60,500?`,
      isProposal: true,
      proposalType: "buy",
      price: 60500,
    },
  ]

  // useChatフックの返す値を取得し、型を拡張
  const {
    messages: originalMessages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    setMessages: setOriginalMessages,
    isLoading,
    error
  } = useChat({
    // 追加: 会話IDがある場合は専用のAPIエンドポイントにリクエスト
    api: conversationId 
      ? `/api/messages/${conversationId}`
      : "/api/mastra/chat",
    // 追加: システムプロンプトがある場合は指示として渡す
    body: {
      threadId: conversationId,
      instructions: system_prompt,
    },
    // 追加: 会話IDがある場合は初期メッセージを空に
    initialMessages: conversationId ? [] : (initialMessages as Message[]),
    onFinish: (message) => {
      // Check if the message suggests an entry
      if (message.content.includes("enter") || message.content.includes("position")) {
        // Extract entry details from AI message
        const isBuy = !message.content.includes("sell") && !message.content.includes("short")
        const priceMatch = message.content.match(/(\d+,?\d*)/)
        const price = priceMatch
          ? Number.parseFloat(priceMatch[0].replace(",", ""))
          : ohlcData.length > 0 ? ohlcData[ohlcData.length - 1].close : 0

        setPendingEntry({
          id: Date.now().toString(),
          userId: getCurrentUserId(), // 現在のユーザーIDを設定
          side: isBuy ? "buy" : "sell",
          symbol: "BTC/USD",
          price,
          time: new Date().toISOString(),
          status: "open",
        })
      } else {
        setPendingEntry(null)
      }

      // End searching state
      setIsSearching(false)
    },
    onError: () => {
      setIsSearching(false)
    },
  })

  // ストリーミングメッセージ管理
  useStreamingMessages(isLoading, originalMessages as ExtendedMessage[])

  // 型変換用のヘルパー
  const messages = originalMessages as ExtendedMessage[];
  const setMessages = (newMessages: ExtendedMessage[]) => {
    setOriginalMessages(newMessages as Message[]);
  };
  
  // isLoadingをisSearchingに同期
  useEffect(() => {
    setIsSearching(isLoading)
  }, [isLoading])

  // サンプルレスポンス処理を統合
  const { handleSubmit } = useSampleResponses({
    input,
    messages,
    setMessages,
    setPendingEntry,
    setIsSearching,
    conversationId,
    submit: originalHandleSubmit,
  })

  // エントリー操作管理
  const { handleAIProposalQuery, handleProceedWithEntry, handleCancelEntry } =
    useEntryManager({
      pendingEntry,
      setPendingEntry,
      executeEntry,
      setActiveTab,
      messages,
      setMessages,
    })

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isSearching,
    pendingEntry,
    handleProceedWithEntry,
    handleCancelEntry,
    handleAIProposalQuery,
    error,
  }
}

