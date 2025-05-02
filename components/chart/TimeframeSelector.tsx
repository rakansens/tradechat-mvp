"use client"
import type { Timeframe } from "@/types"
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
        <ToggleGroupItem key={timeframe} value={timeframe} size="sm" className="px-2 py-1 h-7">
          {timeframe}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
