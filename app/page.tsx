// Fixed hydration error by explicitly specifying the locale 'en-US' in toLocaleString() for the price badge.
"use client"

import { useEffect, useRef } from "react"
import { BarChart3, LineChart, CandlestickChart, Settings, Bell } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

import ChartSection from "@/components/chart/ChartSection"
import ChatSection from "@/components/chat/ChatSection"
import PositionHistory from "@/components/position/PositionHistory"
import TimeframeSelector from "@/components/chart/TimeframeSelector"
import { useStore } from "@/store/useStore"

export default function Home() {
  // Get state and actions from the store
  const {
    // Chart state
    timeframe,
    setTimeframe,
    ohlcData,
    refreshOhlcData,

    // Entry state
    entries,
    pendingEntry,
    executeEntry,
    closePosition,
    cancelPosition,

    // Chat state
    messages,
    isSearching,

    // UI state
    activeTab,
    setActiveTab,
  } = useStore()

  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Refresh data when component mounts
  useEffect(() => {
    refreshOhlcData()
  }, [refreshOhlcData])

  // Scroll chat to bottom when messages update
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Count open positions
  const openPositionsCount = entries.filter((entry) => entry.status === "open").length

  return (
    <main className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <CandlestickChart className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            AlphaTrader
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="font-mono">
            BTC/USD: ${ohlcData[ohlcData.length - 1].close.toLocaleString('en-US')}
          </Badge>
          <PriceChangeIndicator
            currentPrice={ohlcData[ohlcData.length - 1].close}
            previousPrice={ohlcData[ohlcData.length - 2].close}
          />
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-col md:flex-row h-full">
        {/* Chat Section */}
        <ChatSection
          messages={messages}
          isSearching={isSearching}
          pendingEntry={pendingEntry}
          chatEndRef={chatEndRef}
          executeEntry={executeEntry}
        />

        {/* Chart and Position History Section */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full p-3">
          <Card className="h-full flex flex-col">
            <div className="flex justify-between items-center p-3 border-b">
              <div className="flex items-center">
                <h2 className="text-lg font-bold mr-2">BTC/USD</h2>
                <Badge variant="outline" className="font-mono">
                  24h Vol: 12.5K
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TimeframeSelector selectedTimeframe={timeframe} onTimeframeChange={setTimeframe} />
                <Separator orientation="vertical" className="h-6" />
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="chart" className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger value="positions" className="flex items-center relative">
                      <LineChart className="h-4 w-4 mr-1" />
                      Positions
                      {openPositionsCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
                          {openPositionsCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsContent value="chart" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
                <ChartSection ohlcData={ohlcData} entries={entries} timeframe={timeframe} />
              </TabsContent>

              <TabsContent value="positions" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
                <PositionHistory entries={entries} onClosePosition={closePosition} onCancelPosition={cancelPosition} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Price change indicator component
function PriceChangeIndicator({ currentPrice, previousPrice }: { currentPrice: number; previousPrice: number }) {
  const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100
  const isPositive = percentChange >= 0

  return (
    <Badge variant={isPositive ? "success" : "destructive"} className="font-mono">
      {isPositive ? "+" : ""}
      {percentChange.toFixed(2)}%
    </Badge>
  )
}
