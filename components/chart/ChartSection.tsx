"use client"

import { getTimeframeDisplayName } from "@/utils/ohlcDummyData"
import ChartCanvas from "@/components/chart/ChartCanvas"
import type { Entry } from "@/types"
import type { Timeframe } from "@/utils/ohlcDummyData"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, CandlestickChart, LineChart } from "lucide-react"
import { useStore } from "@/store/useStore"
import { theme } from "@/styles/colors"

interface ChartSectionProps {
  ohlcData: any[]
  entries: Entry[]
  timeframe: Timeframe
}

export default function ChartSection({ ohlcData, entries, timeframe }: ChartSectionProps) {
  const { chartType, setChartType } = useStore()

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* TradingView風のチャートヘッダー */}
      <div className="flex justify-between items-center px-2 py-1" style={{ backgroundColor: theme.background.card, borderColor: theme.border.light, borderBottomWidth: '1px' }}>
        <div className="flex items-center space-x-2">
          {/* タイムフレームバッジ */}
          <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.highlight, color: theme.text.secondary }}>
            {getTimeframeDisplayName(timeframe)}
          </Badge>
          
          {/* チャートタイプ選択 - TradingViewスタイル */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="h-7">
            <TabsList className="h-7 p-0.5 border" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light }}>
              <TabsTrigger 
                value="candles" 
                className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
              >
                <CandlestickChart className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger 
                value="line" 
                className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
              >
                <LineChart className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger 
                value="bar" 
                className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* 価格情報 */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs" style={{ color: theme.text.secondary }}>
            <span className="font-medium">O: <span style={{ color: theme.text.primary }}>61,240</span></span>
            <span className="font-medium">H: <span style={{ color: theme.text.primary }}>61,850</span></span>
            <span className="font-medium">L: <span style={{ color: theme.text.primary }}>60,110</span></span>
            <span className="font-medium">C: <span style={{ color: theme.accent.green }}>61,290</span></span>
          </div>
        </div>
        
        {/* 右側のインジケーターボタンと設定ボタン */}
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-xs py-0.5 px-1.5 bg-[#2a2e39] hover:bg-[#363a45] border-[#363a45] text-green-500">
            +2.5%
          </Badge>
          <Badge variant="secondary" className="text-xs py-0.5 px-1.5 bg-[#2196f3] border-none text-white hover:bg-[#1e88e5]">
            インジケーター
          </Badge>
        </div>
      </div>
      
      {/* チャートキャンバス - 全画面表示 */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ChartCanvas data={ohlcData} entries={entries} timeframe={timeframe} chartType={chartType} />
      </CardContent>
    </div>
  )
}
