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
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center p-3">
        <div className="flex items-center">
          <Badge variant="outline" className="font-mono">
            {getTimeframeDisplayName(timeframe)}
          </Badge>
        </div>
        <Tabs value={chartType} onValueChange={(v) => setChartType(v as any)} className="h-8">
          <TabsList className="h-8">
            <TabsTrigger value="candles" className="h-7 px-2">
              <CandlestickChart className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="line" className="h-7 px-2">
              <LineChart className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bar" className="h-7 px-2">
              <BarChart3 className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CardContent className="flex-1 p-0">
        <ChartCanvas data={ohlcData} entries={entries} timeframe={timeframe} chartType={chartType} />
      </CardContent>
    </div>
  )
}
