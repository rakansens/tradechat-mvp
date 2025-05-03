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
import { 
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore,
  // その他のストア
  useEntryStore, 
  useChatStore, 
  useUIStore 
} from "@/store"
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
  
  // 分割されたチャートストアから状態とアクションを取得
  
  // チャートデータ関連
  const data = useChartDataStore((state) => state.data);
  const currentTimeFrame = useChartDataStore((state) => state.currentTimeFrame);
  const updateTimeFrame = useChartDataStore((state) => state.updateTimeFrame);
  const fetchData = useChartDataStore((state) => state.fetchData);
  
  // チャート設定関連
  const chartType = useChartConfigStore((state) => state.chartType);
  const setChartType = useChartConfigStore((state) => state.setChartType);
  
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
    // 新しいストアを使用してチャートデータを取得
    fetchData('BTC/USDT', currentTimeFrame);
  }, [fetchData, currentTimeFrame]);

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
            {/* ヘッダーはChartToolbarに統合されました */}

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
              <TabsContent value="chart" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
                <ChartSection />
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
