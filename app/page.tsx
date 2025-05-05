// app/page.tsx
// 更新: any型を排除し、正しい型を使用するように修正
// 追加: リサイズ可能なパネル機能を実装
"use client"

import { useEffect, useRef, useCallback } from "react"
import { Bell, CandlestickChart, BarChart3, LineChart, MessageSquare, Settings } from "lucide-react"
import { PanelGroup, Panel, ImperativePanelHandle } from "react-resizable-panels"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ResizeHandle } from "@/components/ui/ResizeHandle"
import { MobileResizeHandle } from "@/components/ui/MobileResizeHandle"
// import { ThemeToggle } from "@/components/theme-toggle"

import ChartSection from "@/components/chart/ChartSection"
import ChatSection from "@/components/chat/ChatSection"
import PositionHistory from "@/components/position/PositionHistory"
import TimeframeSelector from "@/components/chart/TimeframeSelector"
import ChartToolbar from "@/components/chart/ChartToolbar"
// import PriceChangeIndicator from "@/components/ui/PriceChangeIndicator"
import { 
  // 分割されたチャートストア
  useChartDataStore,
  useChartConfigStore,
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectPriceChangePercent,
  selectHighPrice,
  selectLowPrice,
  selectDateRange,
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
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // --- Zustand Stores (using individual selectors from separate stores) ---
  // エントリーストアから状態とアクションを取得
  const entries = useEntryStore((state) => state.entries);
  const pendingEntry = useEntryStore((state) => state.pendingEntry);
  const setPendingEntry = useEntryStore((state) => state.setPendingEntry);
  const executeStoreEntry = useEntryStore((state) => state.executeEntry);
  const closePosition = useEntryStore((state) => state.closePosition);
  const cancelPosition = useEntryStore((state) => state.cancelPosition);
  
  // 分割されたチャートストアから状態とアクションを取得
  
  // チャートデータ関連（メモ化されたセレクターを使用）
  const { 
    currentSymbol,
    currentTimeFrame,
    updateTimeFrame,
    fetchData,
    isLoading: chartLoading,
    error: chartError
  } = useChartDataStore();
  
  // メモ化されたセレクターを使用してデータを取得
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const priceChangePercent = useChartDataStore(selectPriceChangePercent);
  const highPrice = useChartDataStore(selectHighPrice);
  const lowPrice = useChartDataStore(selectLowPrice);
  const dateRange = useChartDataStore(selectDateRange);
  
  // チャート設定関連
  const { chartType, setChartType } = useChartConfigStore();
  
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
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">TradeChat Exchange</h1>
          <Badge variant="outline" className="text-xs">BETA</Badge>
          {currentPrice > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="font-mono text-sm py-1 px-2" style={{
                backgroundColor: theme.background.tertiary,
                borderColor: theme.border.light,
                color: theme.text.primary,
                fontWeight: 'bold',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}>
                {currentSymbol}: ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Badge>
              {priceChangePercent !== 0 && (
                <Badge 
                  className="text-sm py-1 px-2"
                  style={{
                    backgroundColor: priceChangePercent >= 0 ? `${theme.accent.green}20` : `${theme.accent.red}20`,
                    borderColor: priceChangePercent >= 0 ? theme.accent.green : theme.accent.red,
                    color: priceChangePercent >= 0 ? theme.accent.green : theme.accent.red,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
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

      {/* リサイズ可能なパネルレイアウト */}
      <div className="h-full" style={{ backgroundColor: theme.background.primary }}>
        {/* モバイル表示 - スタックレイアウト（縦方向にリサイズ） */}
        <div className="flex flex-col h-full md:hidden" ref={mobileContainerRef}>
          <div className="h-1/2 min-h-[200px] overflow-hidden">
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
          
          {/* モバイル用リサイズハンドル */}
          <MobileResizeHandle
            containerRef={mobileContainerRef}
            onResize={(topHeight, bottomHeight) => {
              // リサイズ後の処理（オプション）
              console.log(`Top height: ${topHeight}px, Bottom height: ${bottomHeight}px`);
            }}
            minTopHeight={150}
            minBottomHeight={150}
          />
          
          <div className="h-1/2 min-h-[200px] overflow-hidden">
            <Card className="h-full flex flex-col border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.card }}>
              <ChartToolbar />
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
        
        {/* デスクトップ表示 - react-resizable-panels使用 */}
        <div className="hidden md:block h-full">
          <PanelGroup 
            direction="horizontal" 
            onLayout={(sizes: number[]) => {
              // 任意: サイズをローカルストレージに保存
              localStorage.setItem('panelSizes', JSON.stringify(sizes));
            }}
          >
            {/* Chat Panel */}
            <Panel 
              defaultSize={30} 
              minSize={20}
              className="overflow-hidden"
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
            </Panel>
            
            {/* リサイズハンドル */}
            <ResizeHandle />
            
            {/* Chart Panel */}
            <Panel 
              defaultSize={70} 
              minSize={30}
              className="overflow-hidden"
            >
              <Card className="h-full flex flex-col border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.card }}>
                <ChartToolbar />
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
                  <TabsContent value="chart" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
                    <ChartSection />
                  </TabsContent>
                  <TabsContent value="positions" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
                    <PositionHistory entries={entries} onClosePosition={closePosition} onCancelPosition={cancelPosition} />
                  </TabsContent>
                </Tabs>
              </Card>
            </Panel>
          </PanelGroup>
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
