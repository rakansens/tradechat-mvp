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
      <div className="flex justify-between items-center px-2 py-1 bg-[#1E222D] border-b border-[#2A2E39]">
        <div className="flex items-center space-x-2">
          {/* タイムフレームバッジ */}
          <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5 bg-[#242838] hover:bg-[#2a2e3d] border-[#374151] text-[#A7B0C4]">
            {getTimeframeDisplayName(timeframe)}
          </Badge>
          
          {/* チャートタイプ選択 - TradingViewスタイル */}
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="h-7">
            <TabsList className="h-7 bg-[#242838] p-0.5 border border-[#2A2E39]">
              <TabsTrigger value="candles" className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]">
                <CandlestickChart className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="line" className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]">
                <LineChart className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="bar" className="h-6 px-2 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]">
                <BarChart3 className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* 価格情報 */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-[#A7B0C4]">
            <span className="font-medium">O: <span className="text-[#E0E3EB]">61,240</span></span>
            <span className="font-medium">H: <span className="text-[#E0E3EB]">61,850</span></span>
            <span className="font-medium">L: <span className="text-[#E0E3EB]">60,110</span></span>
            <span className="font-medium">C: <span className="text-[#E0E3EB]">61,735</span></span>
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
