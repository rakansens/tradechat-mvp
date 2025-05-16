// components/chart/TimeframeSelector.tsx
// 更新: 共通インターフェースを使用するように修正
// 更新: メモ化を適用してパフォーマンスを最適化
"use client"
import { memo } from "react"
import type { Timeframe } from "@/types/chart"
import type { TimeframeControlProps } from "@/types/common/interfaces"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

// TimeframeControlPropsを拡張して使用
type TimeframeSelectorProps = {
  // selectedTimeframeはTimeframeControlPropsのtimeframeにマッピングされる
  selectedTimeframe: TimeframeControlProps["timeframe"]
  onTimeframeChange: TimeframeControlProps["onTimeframeChange"]
}

// 利用可能なタイムフレームを定数化
const AVAILABLE_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"]

const TimeframeSelector = memo(function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={selectedTimeframe}
      onValueChange={(value) => value && onTimeframeChange(value as Timeframe)}
    >
      {AVAILABLE_TIMEFRAMES.map((timeframe) => (
        <ToggleGroupItem 
          key={timeframe} 
          value={timeframe} 
          size="sm" 
          className="px-2 py-1 h-7 text-[#A7B0C4] data-[state=on]:bg-[#2962FF] data-[state=on]:text-white border-[#2A2E39] hover:bg-[#242838]"
        >
          {timeframe}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
})

export default TimeframeSelector;
