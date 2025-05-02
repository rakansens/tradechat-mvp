// store/useStore.ts
// 更新: Message型をExtendedMessage型に置き換えて型エラーを修正

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { generateOHLCData } from "@/utils/ohlcDummyData"
import type { Entry, OpenEntry } from "@/types/entry"
import type { Timeframe, ChartType } from "@/types/chart"
import type { ExtendedMessage, ProposalType } from "@/types/chat"

// Chart Store Types
interface ChartState {
  timeframe: Timeframe
  chartType: "candles" | "line" | "bar"
  ohlcData: any[]

  // Actions
  setTimeframe: (timeframe: Timeframe) => void
  setChartType: (type: "candles" | "line" | "bar") => void
  refreshOhlcData: () => void
}

// Entry Store Types
interface EntryState {
  entries: Entry[]
  pendingEntry: OpenEntry | null

  // Actions
  setPendingEntry: (entry: OpenEntry | null) => void
  executeEntry: () => void
  closePosition: (entryId: string, exitPrice: number) => void
  cancelPosition: (entryId: string) => void
}

// Chat Store Types
interface ChatState {
  messages: ExtendedMessage[]
  isSearching: boolean

  // Actions
  setMessages: (messages: ExtendedMessage[]) => void
  addMessage: (message: ExtendedMessage) => void
  setIsSearching: (isSearching: boolean) => void
  handleEntryPointQuery: () => void
  handleNewsQuery: () => void
  handleAIProposalQuery: () => void
}

// UI Store Types
interface UIState {
  activeTab: string

  // Actions
  setActiveTab: (tab: string) => void
}

// Combined Store State
interface StoreState extends ChartState, EntryState, ChatState, UIState {}

// Helper function to determine data points based on timeframe
function getDataPointsForTimeframe(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1m":
      return 60 * 24 // 1 day of minute data
    case "5m":
      return 12 * 24 // 1 day of 5-minute data
    case "15m":
      return 4 * 24 // 1 day of 15-minute data
    case "1h":
      return 24 * 7 // 1 week of hourly data
    case "4h":
      return 6 * 7 // 1 week of 4-hour data
    case "1d":
      return 30 // 1 month of daily data
    default:
      return 100
  }
}

// Create the store
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (set, get) => {
        // Initial OHLC data
        const initialTimeframe: Timeframe = "1d"
        const initialOhlcData = generateOHLCData(getDataPointsForTimeframe(initialTimeframe), initialTimeframe)

        // Initial messages
        const initialMessages: ExtendedMessage[] = [
          {
            id: "welcome",
            role: "assistant",
            content:
              "Welcome to AlphaTrader! I'm your AI trading assistant. How can I help you analyze the market today?",
          },
          {
            id: "ai-proposal-1",
            role: "assistant",
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

        return {
          // Chart State
          timeframe: initialTimeframe,
          chartType: "candles",
          ohlcData: initialOhlcData,

          // Entry State
          entries: [
            {
              id: "1",
              side: "buy",
              symbol: "BTC/USD",
              price: 58750,
              time: "2023-05-01T10:30:00Z",
              status: "closed",
              exitPrice: 61200,
              exitTime: "2023-05-02T14:45:00Z",
              profit: 2450,
            },
            {
              id: "2",
              side: "sell",
              symbol: "BTC/USD",
              price: 62500,
              time: "2023-05-03T09:15:00Z",
              status: "closed",
              exitPrice: 59800,
              exitTime: "2023-05-04T16:20:00Z",
              profit: 2700,
            },
            {
              id: "3",
              side: "buy",
              symbol: "BTC/USD",
              price: 59200,
              time: "2023-05-05T11:00:00Z",
              status: "open",
            },
          ],
          pendingEntry: null,

          // Chat State
          messages: initialMessages,
          isSearching: false,

          // UI State
          activeTab: "chart",

          // Chart Actions
          setTimeframe: (timeframe) => {
            const dataPoints = getDataPointsForTimeframe(timeframe)
            set({
              timeframe,
              ohlcData: generateOHLCData(dataPoints, timeframe),
            })
          },
          setChartType: (chartType) => set({ chartType }),
          refreshOhlcData: () => {
            const { timeframe } = get()
            const dataPoints = getDataPointsForTimeframe(timeframe)
            set({ ohlcData: generateOHLCData(dataPoints, timeframe) })
          },

          // Entry Actions
          setPendingEntry: (pendingEntry) => set({ pendingEntry }),
          executeEntry: () => {
            const { pendingEntry, entries } = get()
            if (pendingEntry) {
              set({
                entries: [...entries, pendingEntry],
                pendingEntry: null,
              })
            }
          },
          closePosition: (entryId, exitPrice) => {
            const { entries } = get()
            const updatedEntries = entries.map((entry) => {
              if (entry.id === entryId && entry.status === "open") {
                const profit =
                  entry.side === "buy" ? exitPrice - entry.price : entry.price - exitPrice
                return {
                  ...entry,
                  status: "closed",
                  exitPrice,
                  exitTime: new Date().toISOString(),
                  profit,
                }
              }
              return entry
            })
            set({ entries: updatedEntries })
          },
          cancelPosition: (entryId) => {
            const { entries } = get()
            const updatedEntries = entries.map((entry) => {
              if (entry.id === entryId && entry.status === "open") {
                return {
                  ...entry,
                  status: "canceled",
                }
              }
              return entry
            })
            set({ entries: updatedEntries })
          },

          // Chat Actions
          setMessages: (messages) => set({ messages }),
          addMessage: (message) => {
            const { messages } = get()
            set({ messages: [...messages, message] })
          },
          setIsSearching: (isSearching) => set({ isSearching }),

          // Sample chat responses for demo
          handleEntryPointQuery: () => {
            const { messages } = get()

            const userMessage: ExtendedMessage = {
              id: Date.now().toString(),
              role: "user",
              content: "Entry Point",
            }

            const aiResponse: ExtendedMessage = {
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
            }

            // Update messages
            set({
              messages: [...messages, userMessage, aiResponse],
              isSearching: false,
            })

            // Set entry information
            set({
              pendingEntry: {
                id: Date.now().toString(),
                side: "buy",
                symbol: "BTC/USD",
                price: 60500,
                time: new Date().toISOString(),
                status: "open",
                takeProfit: 62000,
                stopLoss: 59000,
              },
            })
          },

          handleNewsQuery: () => {
            const { messages } = get()

            const userMessage: ExtendedMessage = {
              id: Date.now().toString(),
              role: "user",
              content: "Latest News",
            }

            const aiResponse: ExtendedMessage = {
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
            }

            // Update messages
            set({
              messages: [...get().messages, userMessage, aiResponse],
              isSearching: false,
            })

            // Set entry information
            set({
              pendingEntry: {
                id: Date.now().toString(),
                side: "buy",
                symbol: "BTC/USD",
                price: 60500,
                time: new Date().toISOString(),
                status: "open",
              },
            })
          },

          handleAIProposalQuery: () => {
            const { messages } = get()

            // Generate a random proposal
            const isBuy = Math.random() > 0.5
            const price = get().ohlcData[get().ohlcData.length - 1].close
            const proposalType: ProposalType = isBuy ? "buy" : "sell"

            const userMessage: ExtendedMessage = {
              id: Date.now().toString(),
              role: "user",
              content: "AI Proposal",
            }

            const aiResponse: ExtendedMessage = {
              id: Date.now().toString() + "-response",
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
            }

            // Update messages
            set({
              messages: [...get().messages, userMessage, aiResponse],
              isSearching: false,
            })

            // Set entry information
            set({
              pendingEntry: {
                id: Date.now().toString(),
                side: proposalType,
                symbol: "BTC/USD",
                price,
                time: new Date().toISOString(),
                status: "open",
              },
            })
          },

          // UI Actions
          setActiveTab: (activeTab) => set({ activeTab }),
        }
      },
      {
        name: "tradechat-store",
      }
    )
  )
)
