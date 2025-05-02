"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import type { Entry } from "@/types"
import type { ChangeEvent, FormEvent } from "react"

interface UseChatInteractionProps {
  ohlcData: any[]
  pendingEntry: Entry | null
  setPendingEntry: (entry: Entry | null) => void
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
  const initialMessages = [
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

  const { messages, input, handleInputChange, handleSubmit, setMessages } = useChat({
    api: "/api/chat",
    initialMessages: initialMessages,
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

  // Handle sample responses for specific keywords
  const handleSubmitWithSamples = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (input.trim() === "Market News") {
      handleNewsQuery()
    } else if (input.trim() === "Entry Point") {
      handleEntryPointQuery()
    } else if (input.trim() === "Sell Entry") {
      handleSellEntryQuery()
    } else if (input.trim() === "AI Signal") {
      handleAIProposalQuery()
    } else {
      // Normal submission
      handleSubmit(e)
    }
  }

  // Handle news query
  const handleNewsQuery = () => {
    setIsSearching(true)

    // Add a slight delay to show the searching state
    setTimeout(() => {
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: input },
        {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: `Here's the latest Bitcoin market news:

1. Bitcoin price has risen 5% in the last 24 hours, currently trading around $61,200.
2. U.S. regulators are considering a new regulatory framework for crypto assets.
3. Major institutional investors have increased their Bitcoin positions.
4. Technical analysis shows Bitcoin trading above its 50-day moving average, indicating a bullish signal.
5. Market volatility has decreased by 20% compared to last week.

Based on these developments, the short-term trend appears bullish, but watch for regulatory news that could impact the market.`,
        },
      ])
      setIsSearching(false)
    }, 1500)

    // Clear input
    handleInputChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>)
  }

  // Handle entry point query
  const handleEntryPointQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: "user", content: input },
      {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: `Based on my analysis of the current chart, Bitcoin is in a short-term uptrend.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $61,500, recent low: $59,500
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $60,500? Target: $62,000, Stop loss: $59,000.`,
        isProposal: true,
        proposalType: "buy",
        price: 60500,
      },
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

    // Clear input
    handleInputChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>)
  }

  // Handle sell entry query
  const handleSellEntryQuery = () => {
    setMessages([
      ...messages,
      { id: Date.now().toString(), role: "user", content: input },
      {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: `Chart analysis indicates Bitcoin may experience a short-term decline.

Technical Analysis:
• Price has pulled back from recent highs
• Failed to break resistance at $61,000
• Short-term momentum indicators are weakening

Would you like to enter a short position at the current price of $60,800? Target: $59,500, Stop loss: $61,500.`,
        isProposal: true,
        proposalType: "sell",
        price: 60800,
      },
    ])

    // Set entry information
    setPendingEntry({
      id: Date.now().toString(),
      side: "sell",
      symbol: "BTC/USD",
      price: 60800,
      time: new Date().toISOString(),
      status: "open",
    })

    // Clear input
    handleInputChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>)
  }

  // Handle AI proposal query
  const handleAIProposalQuery = () => {
    // Simulate AI proposal
    setTimeout(() => {
      const randomPrice = Math.floor(60000 + Math.random() * 2000)
      const isBuy = Math.random() > 0.5

      setMessages([
        ...messages,
        { id: Date.now().toString(), role: "user", content: input },
        {
          id: Date.now().toString() + "-proposal",
          role: "assistant",
          content: `I've detected a ${isBuy ? "BUY" : "SELL"} signal!

Technical Analysis:
• ${isBuy ? "Uptrend forming" : "Downtrend forming"}
• ${isBuy ? "RSI rising but not yet overbought" : "RSI falling but not yet oversold"}
• ${isBuy ? "Price bouncing off support level" : "Price rejecting at resistance level"}

Would you like to enter a ${isBuy ? "long" : "short"} position at the current price of $${randomPrice.toLocaleString()}?`,
          isProposal: true,
          proposalType: isBuy ? "buy" : "sell",
          price: randomPrice,
        },
      ])

      // Set entry information
      setPendingEntry({
        id: Date.now().toString(),
        side: isBuy ? "buy" : "sell",
        symbol: "BTC/USD",
        price: randomPrice,
        time: new Date().toISOString(),
        status: "open",
      })
    }, 1000)

    // Clear input
    handleInputChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>)
  }

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setMessages,
    isSearching,
    setIsSearching,
    handleSubmitWithSamples,
  }
}
