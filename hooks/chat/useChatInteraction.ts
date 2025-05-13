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
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { useRootStore, selectLatestProposal } from "@/store"
import type { Entry, OpenEntry, TradeSide } from "@/types/entry"
import type { ExtendedMessage, ProposalType } from "@/types/chat"
import type { ChangeEvent, FormEvent } from "react"
import type { Message } from "ai"

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

  // ストリーミング中のメッセージを処理するための状態と参照
  const streamingMessageIdRef = useRef<string | null>(null);
  
  // isLoadingがtrueの場合、AIからの応答がストリーミング中と判断
  // originalMessagesの変更を監視して、最後のメッセージが更新されたらそれを表示
  useEffect(() => {
    if (isLoading && originalMessages.length > 0) {
      // 最後のメッセージがAIのメッセージであれば、それはストリーミング中のメッセージ
      const lastMessage = originalMessages[originalMessages.length - 1];
      if (lastMessage.role === 'assistant') {
        // ストリーミングメッセージIDを保存または更新
        if (!streamingMessageIdRef.current) {
          // 新しいストリーミングメッセージの場合、IDを生成して保存
          streamingMessageIdRef.current = `streaming-${Date.now()}`;
          
          // 新しいメッセージをストアに追加
          const streamingMessage: ExtendedMessage = {
            id: streamingMessageIdRef.current,
            role: 'assistant',
            content: lastMessage.content,
            isStreaming: true, // ストリーミング中であることを示すフラグを追加
          };
          
          // useChatStoreをuseRootStoreに変更
          useRootStore.getState().addMessage(streamingMessage);
        } else {
          // 既存のストリーミングメッセージを更新
          // useChatStoreをuseRootStoreに変更
          useRootStore.getState().updateMessage(
            streamingMessageIdRef.current,
            {
              content: lastMessage.content,
              isStreaming: true // ストリーミング中であることを示すフラグを更新
            }
          );
        }
      }
    } else if (!isLoading && streamingMessageIdRef.current) {
      // ストリーミングが終了した場合、isStreamingフラグをfalseに設定して参照をリセット
      // useChatStoreをuseRootStoreに変更
      useRootStore.getState().updateMessage(
        streamingMessageIdRef.current,
        { isStreaming: false }
      );
      streamingMessageIdRef.current = null;
    }
  }, [isLoading, originalMessages]);

  // 型変換用のヘルパー
  const messages = originalMessages as ExtendedMessage[];
  const setMessages = (newMessages: ExtendedMessage[]) => {
    setOriginalMessages(newMessages as Message[]);
  };
  
  // isLoadingをisSearchingに同期
  useEffect(() => {
    setIsSearching(isLoading);
  }, [isLoading]);

  // Handle sample responses for specific keywords
  const handleSubmitWithSamples = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // 追加: 会話IDがある場合は常に通常のAI応答を使用
    if (conversationId) {
      setIsSearching(true)
      originalHandleSubmit(e)
      return
    }

    // Set searching state
    setIsSearching(true)

    // Check for specific keywords to trigger sample responses
    if (input.toLowerCase().includes("entry point") || input.toLowerCase().includes("buy signal")) {
      handleEntryPointQuery()
      return
    }

    if (input.toLowerCase().includes("news") || input.toLowerCase().includes("latest")) {
      handleNewsQuery()
      return
    }

    // Default to normal AI response
    originalHandleSubmit(e)
  }

  // Handle entry point query
  const handleEntryPointQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: "user", content: input } as ExtendedMessage,
      {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: `Based on my analysis of the BTC/USD chart, I've identified a potential entry point.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $61,500, recent low: $59,500
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $60,500? Target: $62,000, Stop loss: $59,000.`,
        isProposal: true,
        proposalType: "buy",
        price: 60500,
      } as ExtendedMessage,
    ])

    // Set entry information
    setPendingEntry({
      id: Date.now().toString(),
      side: "buy",
      symbol: "BTC/USD",
      price: 60500,
      time: new Date().toISOString(),
      status: "open",
      takeProfit: 62000,
      stopLoss: 59000,
    })

    // End searching state
    setIsSearching(false)
  }

  // Handle news query
  const handleNewsQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: "user", content: input } as ExtendedMessage,
      {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: `Here are the latest Bitcoin news headlines:

1. Bitcoin price surges 5% in the last 24 hours, reaching $60,500
2. Major institutional investor announces $100M Bitcoin purchase
3. New regulatory framework for cryptocurrencies proposed in the US
4. Bitcoin mining difficulty increases by 3.4% after latest adjustment

Would you like to enter a long position based on this positive news sentiment?`,
        isProposal: true,
        proposalType: "buy",
        price: 60500,
      } as ExtendedMessage,
    ])

    // Set entry information
    setPendingEntry({
      id: Date.now().toString(),
      side: "buy",
      symbol: "BTC/USD",
      price: 60500,
      time: new Date().toISOString(),
      status: "open",
    })

    // End searching state
    setIsSearching(false)
  }

  // Handle AI proposal query
  const handleAIProposalQuery = () => {
    // Get the latest proposal message
    const latestProposal = useRootStore(selectLatestProposal)

    // Use latest proposal details if available, otherwise use defaults
    const proposalDetails = latestProposal
      ? {
          price: latestProposal.price || 60500,
          side: (latestProposal.proposalType === "buy" ? "buy" : "sell") as TradeSide,
        }
      : {
          price: 60500,
          side: "buy" as TradeSide,
        }

    // Set entry information
    setPendingEntry({
      id: Date.now().toString(),
      side: proposalDetails.side,
      symbol: "BTC/USD",
      price: proposalDetails.price,
      time: new Date().toISOString(),
      status: "open",
    })

    // Switch to the chart tab
    setActiveTab("chart")

    // End searching state
    setIsSearching(false)
  }

  // Proceed with pending entry
  const handleProceedWithEntry = () => {
    if (pendingEntry) {
      executeEntry()
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          role: "user",
          content: "Execute trade",
        } as ExtendedMessage,
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: `I've executed a ${pendingEntry.side} order for BTC/USD at $${pendingEntry.price}. The position is now open.

I'll monitor this position and alert you of any significant price movements. You can view your position details in the Trades tab.`,
        } as ExtendedMessage,
      ])
    }
  }

  // Cancel pending entry
  const handleCancelEntry = () => {
    setPendingEntry(null)
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: "user",
        content: "Cancel trade",
      } as ExtendedMessage,
      {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: "I've canceled the pending trade. Let me know if you'd like to explore other trading opportunities.",
      } as ExtendedMessage,
    ])
  }

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleSubmitWithSamples,
    isSearching,
    pendingEntry,
    handleProceedWithEntry,
    handleCancelEntry,
    handleAIProposalQuery,
    error,
  }
} 