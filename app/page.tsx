// app/page.tsx
// 更新: any型を排除し、正しい型を使用するように修正
"use client"

import { useEffect, useRef, useCallback } from "react"
import { Bell, CandlestickChart, BarChart3, LineChart, MessageSquare, Settings } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
// import { ThemeToggle } from "@/components/theme-toggle"

import ChartSection from "@/components/chart/ChartSection"
import ChatSection from "@/components/chat/ChatSection"
import PositionHistory from "@/components/position/PositionHistory"
import TimeframeSelector from "@/components/chart/TimeframeSelector"
// import PriceChangeIndicator from "@/components/ui/PriceChangeIndicator"
import { useChartStore, useEntryStore, useChatStore, useUIStore } from "@/store"
import { theme } from "@/styles/colors"

import type { OpenEntry } from "@/types/entry"

import { MastraClient } from '@mastra/client-js'; 
import { useChat } from 'ai/react'; 

const mastraClient = new MastraClient({ 
  baseUrl: '/api/mastra', 
});

export default function Home() {
  // --- Zustand Stores (using individual selectors from separate stores) ---
  // エントリーストアから状態とアクションを取得
  const entries = useEntryStore((state) => state.entries);
  const pendingEntry = useEntryStore((state) => state.pendingEntry);
  const setPendingEntry = useEntryStore((state) => state.setPendingEntry);
  const executeStoreEntry = useEntryStore((state) => state.executeEntry);
  const closePosition = useEntryStore((state) => state.closePosition);
  const cancelPosition = useEntryStore((state) => state.cancelPosition);
  
  // チャートストアから状態とアクションを取得
  const ohlcData = useChartStore((state) => state.ohlcData);
  const timeframe = useChartStore((state) => state.timeframe);
  const chartType = useChartStore((state) => state.chartType);
  const refreshOhlcData = useChartStore((state) => state.refreshOhlcData);
  const setTimeframe = useChartStore((state) => state.setTimeframe);
  const setChartType = useChartStore((state) => state.setChartType);
  
  // UIストアから状態とアクションを取得
  const activeTab = useUIStore((state) => state.activeTab);
  const setActiveTab = useUIStore((state) => state.setActiveTab);

  // --- AI SDK useChat Hook for Chat State and API Interaction ---
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading 
  } = useChat({
    api: '/api/mastra/chat', 
    // Add other useChat options if needed (e.g., initialMessages, body, etc.)
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Wrappers for Store Actions passed to ChatSection ---
  const handleExecuteTrade = useCallback(() => {
    console.log('Executing trade:', pendingEntry);
    executeStoreEntry(); 
    // TODO: Notify Mastra agent about executed trade (might need custom API call via mastraClient)
  }, [executeStoreEntry, pendingEntry]);

  const handleEditSubmit = useCallback((updatedEntry: OpenEntry) => {
    console.log('Updating pending entry:', updatedEntry);
    setPendingEntry(updatedEntry); 
    // TODO: Notify Mastra agent about edited trade proposal?
  }, [setPendingEntry]);

  const handleCancelPendingEntry = useCallback(() => {
    console.log('Cancelling pending entry');
    setPendingEntry(null); 
    // TODO: Notify Mastra agent about cancellation?
  }, [setPendingEntry]);

  // --- Effects ---
  useEffect(() => {
    // Scroll chat to bottom when messages update (from useChat)
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); 
  
  useEffect(() => {
    refreshOhlcData();
  }, [refreshOhlcData]);

  const openPositionsCount = entries.filter((entry) => entry.status === "open").length

  return (
    <main className="flex flex-col h-screen" style={{ backgroundColor: theme.background.primary }}>
      <header className="flex justify-between items-center py-2 px-3 border-b" style={{ borderColor: theme.border.light, backgroundColor: theme.background.secondary }}>
        <div className="flex items-center space-x-2">
          <div className="font-bold text-lg flex items-center">
            <span style={{ color: theme.accent.blue }}>Alpha</span>
            <span style={{ color: theme.text.primary }}>Trader</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light, color: theme.text.primary }}>
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
          {/* <ThemeToggle /> */}
        </div>
      </header>

      {/* 強制的にレイアウトをチャート表示に初期化 */}
      <div className="flex flex-col md:flex-row h-full" style={{ backgroundColor: theme.background.primary }}>
        {/* Chat Section - 常に左サイドバーとして表示、3割の幅に設定 */}
        <div 
          className="md:w-[30%] w-full h-1/2 md:h-full transition-all duration-300 ease-in-out overflow-hidden"
        >
          <ChatSection
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            pendingEntry={pendingEntry}
            chatEndRef={chatEndRef as React.RefObject<HTMLDivElement>}
            executeEntry={handleExecuteTrade}
            editPendingEntry={handleEditSubmit}
            cancelPendingEntry={handleCancelPendingEntry}
          />
        </div>

        {/* Chart and Position History Section - 常に右側に大きく表示、7割の幅に設定 */}
        <div 
          className="md:w-[70%] w-full h-1/2 md:h-full transition-all duration-300 ease-in-out overflow-hidden"
        >
          <Card className="h-full flex flex-col border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.card }}>
            <div className="flex justify-between items-center py-2 px-3 border-b" style={{ borderColor: theme.border.light, backgroundColor: theme.background.secondary }}>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold" style={{ color: theme.text.primary }}>BTC/USD</h2>
                <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light, color: theme.text.secondary }}>
                  24h Vol: 12.5K
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <TimeframeSelector selectedTimeframe={timeframe} onTimeframeChange={setTimeframe} />
                <Separator orientation="vertical" className="h-6 bg-[#374151]" />
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-7">
                  <TabsList className="h-7 bg-[#242838] border border-[#2A2E39]">
                    <TabsTrigger 
                      value="chart" 
                      className="flex items-center h-6 px-2 text-xs data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
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

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
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
    <Badge variant={isPositive ? "success" : "destructive"} className="font-mono bg-opacity-20 border border-opacity-50">
      {isPositive ? "+" : ""}
      {percentChange.toFixed(2)}%
    </Badge>
  )
}
