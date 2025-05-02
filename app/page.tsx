// Fixed hydration error by explicitly specifying the locale 'en-US' in toLocaleString() for the price badge.
"use client"

import { useEffect, useRef } from "react"
import { Bell, CandlestickChart, BarChart3, LineChart, MessageSquare, Settings } from "lucide-react"

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
    chartType,
  } = useStore()

  // Chat scroll ref
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Refresh data when component mounts
  useEffect(() => {
    refreshOhlcData()
    
    // ウィンドウのリサイズイベントを監視してレイアウトを調整
    const handleResize = () => {
      // 必要に応じてレイアウトの調整ロジックを追加
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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
    <main className="flex flex-col h-screen bg-[#131722]">
      <header className="flex justify-between items-center py-2 px-3 border-b border-[#2a2e39] bg-[#0e1016]">
        <div className="flex items-center space-x-2">
          <div className="font-bold text-lg flex items-center">
            <span className="text-[#2196f3]">Alpha</span>
            <span className="text-[#b2b5be]">Trader</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="bg-[#1e2230] border-[#2a2e39] hover:bg-[#2a2e39] text-[#b2b5be]">
            <span className="font-mono">BTC/USD: ${ohlcData[ohlcData.length - 1].close.toLocaleString('en-US')}</span>
            <PriceChangeIndicator
              currentPrice={ohlcData[ohlcData.length - 1].close}
              previousPrice={ohlcData[ohlcData.length - 2].close}
            />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* 強制的にレイアウトをチャート表示に初期化 */}
      <div className="flex flex-col md:flex-row h-full bg-[#131722]">
        {/* Chat Section - 常に左サイドバーとして表示、3割の幅に設定 */}
        <div 
          className="md:w-[30%] w-full h-1/2 md:h-full transition-all duration-300 ease-in-out overflow-hidden"
        >
          <ChatSection
            messages={messages}
            isSearching={isSearching}
            pendingEntry={pendingEntry}
            chatEndRef={chatEndRef as React.RefObject<HTMLDivElement>}
            executeEntry={executeEntry}
          />
        </div>

        {/* Chart and Position History Section - 常に右側に大きく表示、7割の幅に設定 */}
        <div 
          className="md:w-[70%] w-full h-1/2 md:h-full transition-all duration-300 ease-in-out overflow-hidden"
        >
          <Card className="h-full flex flex-col border-0 rounded-none shadow-none bg-[#131722]">
            <div className="flex justify-between items-center py-2 px-3 border-b border-[#2a2e39] bg-[#131722]">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-[#b2b5be]">BTC/USD</h2>
                <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5 bg-[#1e2230] border-[#2a2e39] text-[#b2b5be]">
                  24h Vol: 12.5K
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TimeframeSelector selectedTimeframe={timeframe} onTimeframeChange={setTimeframe} />
                <Separator orientation="vertical" className="h-6 bg-[#2a2e39]" />
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-7">
                  <TabsList className="h-7 bg-[#1e2230] border border-[#2a2e39]">
                    <TabsTrigger 
                      value="chart" 
                      className="flex items-center h-6 px-2 text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#b2b5be]"
                    >
                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger 
                      value="positions" 
                      className="flex items-center relative h-6 px-2 text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#b2b5be]"
                    >
                      <LineChart className="h-3.5 w-3.5 mr-1" />
                      Positions
                      {openPositionsCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-[#2196f3]">
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
