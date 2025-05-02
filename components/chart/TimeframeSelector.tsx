// components/chart/TimeframeSelector.tsx
// 更新: Timeframe型のインポートパスを修正
"use client"
import type { Timeframe } from "@/types/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface TimeframeSelectorProps {
  selectedTimeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
}

export default function TimeframeSelector({ selectedTimeframe, onTimeframeChange }: TimeframeSelectorProps) {
  // Available timeframes
  const availableTimeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"]

  return (
    <ToggleGroup
      type="single"
      value={selectedTimeframe}
      onValueChange={(value) => value && onTimeframeChange(value as Timeframe)}
    >
      {availableTimeframes.map((timeframe) => (
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
}
