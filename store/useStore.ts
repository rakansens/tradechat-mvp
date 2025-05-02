import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { generateOHLCData } from "@/utils/ohlcDummyData"
import type { Entry, Timeframe } from "@/types"
import type { Message } from "ai"

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
  pendingEntry: Entry | null

  // Actions
  setPendingEntry: (entry: Entry | null) => void
  executeEntry: () => void
  closePosition: (entryId: string, exitPrice: number) => void
  cancelPosition: (entryId: string) => void
}

// Chat Store Types
interface ChatState {
  messages: Message[]
  isSearching: boolean

  // Actions
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
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

// Combined Store Type
interface StoreState extends ChartState, EntryState, ChatState, UIState {}

// Helper function to get data points for timeframe
const getDataPointsForTimeframe = (timeframe: Timeframe): number => {
  switch (timeframe) {
    case "1d":
      return 30
    case "4h":
      return 48
    case "1h":
      return 48
    case "15m":
      return 96
    case "5m":
      return 96
    case "1m":
      return 60
    default:
      return 30
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
        const initialMessages: Message[] = [
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
            isProposal: true as any,
            proposalType: "buy" as any,
            price: 60500 as any,
          },
        ]

        return {
          // Chart State
          timeframe: initialTimeframe,
          chartType: "candles",
          ohlcData: initialOhlcData,

          setTimeframe: (timeframe) => {
            set({ timeframe })
            get().refreshOhlcData()
          },

          setChartType: (chartType) => set({ chartType }),

          refreshOhlcData: () => {
            const { timeframe } = get()
            const newData = generateOHLCData(getDataPointsForTimeframe(timeframe), timeframe)
            set({ ohlcData: newData })
          },

          // Entry State
          entries: [],
          pendingEntry: {
            id: `entry-${Date.now()}`,
            side: "buy",
            symbol: "BTC/USD",
            price: 60500,
            time: new Date().toISOString(),
            status: "open",
          },

          setPendingEntry: (pendingEntry) => set({ pendingEntry }),

          executeEntry: () => {
            const { pendingEntry, entries } = get()
            if (pendingEntry) {
              const newEntry = {
                ...pendingEntry,
                id: pendingEntry.id || `entry-${Date.now()}`,
                status: "open" as const,
              }
              set({ entries: [...entries, newEntry], pendingEntry: null })
            }
          },

          closePosition: (entryId, exitPrice) => {
            const { entries } = get()
            const updatedEntries = entries.map((entry) => {
              if (entry.id === entryId) {
                const profit = entry.side === "buy" ? exitPrice - entry.price : entry.price - exitPrice
                return {
                  ...entry,
                  status: "closed" as const,
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
              if (entry.id === entryId) {
                return {
                  ...entry,
                  status: "canceled" as const,
                }
              }
              return entry
            })
            set({ entries: updatedEntries })
          },

          // Chat State
          messages: initialMessages,
          isSearching: false,

          setMessages: (messages) => set({ messages }),

          addMessage: (message) => {
            const { messages } = get()
            set({ messages: [...messages, message] })
          },

          setIsSearching: (isSearching) => set({ isSearching }),

          handleEntryPointQuery: () => {
            const { messages, ohlcData } = get()
            const currentPrice = ohlcData[ohlcData.length - 1].close

            const userMessage: Message = {
              id: Date.now().toString(),
              role: "user",
              content: "Entry Point",
            }

            const aiResponse: Message = {
              id: Date.now().toString() + "-response",
              role: "assistant",
              content: `Based on my analysis of the current chart, Bitcoin is in a short-term uptrend.

Technical Analysis:
• Price is above the 50-day moving average, a bullish indicator
• Recent high: $${(currentPrice * 1.02).toFixed(0)}, recent low: $${(currentPrice * 0.98).toFixed(0)}
• Volume is average with no significant selling pressure

Would you like to enter a long position at the current price of $${currentPrice.toLocaleString()}? Target: $${(currentPrice * 1.05).toFixed(0)}, Stop loss: $${(currentPrice * 0.98).toFixed(0)}.`,
              isProposal: true as any,
              proposalType: "buy" as any,
              price: currentPrice as any,
            }

            set({
              messages: [...messages, userMessage, aiResponse],
              pendingEntry: {
                id: Date.now().toString(),
                side: "buy",
                symbol: "BTC/USD",
                price: currentPrice,
                time: new Date().toISOString(),
                status: "open",
              },
            })
          },

          handleNewsQuery: () => {
            const { messages } = get()

            const userMessage: Message = {
              id: Date.now().toString(),
              role: "user",
              content: "Market News",
            }

            set({ isSearching: true })

            // Simulate API delay
            setTimeout(() => {
              const aiResponse: Message = {
                id: Date.now().toString() + "-response",
                role: "assistant",
                content: `Here's the latest Bitcoin market news:

1. Bitcoin price has risen 5% in the last 24 hours, currently trading around $61,200.
2. U.S. regulators are considering a new regulatory framework for crypto assets.
3. Major institutional investors have increased their Bitcoin positions.
4. Technical analysis shows Bitcoin trading above its 50-day moving average, indicating a bullish signal.
5. Market volatility has decreased by 20% compared to last week.

Based on these developments, the short-term trend appears bullish, but watch for regulatory news that could impact the market.`,
              }

              set({
                messages: [...get().messages, userMessage, aiResponse],
                isSearching: false,
              })
            }, 1500)
          },

          handleAIProposalQuery: () => {
            const { messages, ohlcData } = get()
            const currentPrice = ohlcData[ohlcData.length - 1].close
            const randomPrice = Math.floor(currentPrice * (0.98 + Math.random() * 0.04))
            const isBuy = Math.random() > 0.5

            const userMessage: Message = {
              id: Date.now().toString(),
              role: "user",
              content: "AI Signal",
            }

            // Simulate API delay
            setTimeout(() => {
              const aiResponse: Message = {
                id: Date.now().toString() + "-proposal",
                role: "assistant",
                content: `I've detected a ${isBuy ? "BUY" : "SELL"} signal!

Technical Analysis:
• ${isBuy ? "Uptrend forming" : "Downtrend forming"}
• ${isBuy ? "RSI rising but not yet overbought" : "RSI falling but not yet oversold"}
• ${isBuy ? "Price bouncing off support level" : "Price rejecting at resistance level"}

Would you like to enter a ${isBuy ? "long" : "short"} position at the current price of $${randomPrice.toLocaleString()}?`,
                isProposal: true as any,
                proposalType: isBuy ? ("buy" as any) : ("sell" as any),
                price: randomPrice as any,
              }

              set({
                messages: [...get().messages, userMessage, aiResponse],
                pendingEntry: {
                  id: Date.now().toString(),
                  side: isBuy ? "buy" : "sell",
                  symbol: "BTC/USD",
                  price: randomPrice,
                  time: new Date().toISOString(),
                  status: "open",
                },
              })
            }, 1000)
          },

          // UI State
          activeTab: "chart",

          setActiveTab: (activeTab) => set({ activeTab }),
        }
      },
      {
        name: "alpha-trader-storage",
        partialize: (state) => ({
          // Only persist these states
          entries: state.entries,
          activeTab: state.activeTab,
          timeframe: state.timeframe,
          chartType: state.chartType,
        }),
      },
    ),
    { name: "alpha-trader-store" },
  ),
)
