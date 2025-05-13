// hooks/useChatInteraction.ts
// 更新: Message型をExtendedMessage型に置き換えて型エラーを修正
// 更新: メモ化されたセレクタを使用するように更新
// 更新: ストリーミングテキスト表示のためのリアルタイム更新機能を追加
// 更新: ストリーミングメッセージの処理を改善し、isStreaming フラグを設定
// 更新: any型キャストを具体的な型に置き換えて型安全性を向上
// 更新: 2025-05-14 - useChatStoreをuseRootStoreに変更
"use client"

import { useState, useEffect, useRef } from "react"
import { useChat } from "ai/react"
import { useRootStore, useEntryStore, selectLatestProposal } from "@/store"
import type { Entry, OpenEntry } from "@/types/entry"
import type { ExtendedMessage, ProposalType } from "@/types/chat"
import type { ChangeEvent, FormEvent } from "react"
import type { Message } from "ai"

interface UseChatInteractionProps {
  ohlcData: any[]
  pendingEntry: Entry | null
  setPendingEntry: (entry: OpenEntry | null) => void
  entries: Entry[]
  executeEntry: () => void
  setActiveTab: (tab: string) => void
}

export function useChatInteraction({
  ohlcData,
  pendingEntry,
  setPendingEntry,
  entries,
  executeEntry,
  setActiveTab,
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
    api: "/api/mastra/chat",
    initialMessages: initialMessages as Message[],
    onFinish: (message) => {
      // Check if the message suggests an entry
      if (message.content.includes("enter") || message.content.includes("position")) {
        // Extract entry details from AI message
        const isBuy = !message.content.includes("sell") && !message.content.includes("short")
        const priceMatch = message.content.match(/(\d+,?\d*)/)
        const price = priceMatch
          ? Number.parseFloat(priceMatch[0].replace(",", ""))
          : ohlcData[ohlcData.length - 1].close

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

  // Handle AI proposal query (for testing)
  const handleAIProposalQuery = () => {
    // Generate a random proposal
    const isBuy = Math.random() > 0.5
    const price = ohlcData[ohlcData.length - 1].close
    const proposalType: ProposalType = isBuy ? "buy" : "sell"

    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: `Based on my analysis, I recommend a ${isBuy ? "buy" : "sell"} position at the current price of $${price}.

Technical Analysis:
• ${isBuy ? "Price is above the 50-day moving average" : "Price has broken below support"}
• ${isBuy ? "RSI indicates oversold conditions" : "MACD shows a bearish crossover"}
• ${isBuy ? "Volume is increasing on up days" : "Volume is increasing on down days"}

Would you like to enter this ${isBuy ? "long" : "short"} position?`,
        isProposal: true,
        proposalType,
        price,
      } as ExtendedMessage,
    ])

    // Set entry information
    setPendingEntry({
      id: Date.now().toString(),
      side: proposalType,
      symbol: "BTC/USD",
      price,
      time: new Date().toISOString(),
      status: "open",
    })
  }

  // Return the chat state and handlers
  return {
    messages,
    input,
    handleInputChange,
    handleSubmit: handleSubmitWithSamples,
    isSearching,
    setIsSearching,
    handleEntryPointQuery,
    handleNewsQuery,
    handleAIProposalQuery,
  }
}
