"use client"

import { useState, useCallback } from "react"
import type { Timeframe } from "@/types"

export function useTimeframe() {
  const [timeframe, setTimeframe] = useState<Timeframe>("1d")

  // 時間枠に応じたデータポイント数を取得
  const getDataPointsForTimeframe = useCallback((tf: Timeframe): number => {
    switch (tf) {
      case "1d":
        return 30
      case "4h":
        return 48
      case "1h":
        return 48
      case "15m":
        return 96
      case "5m":
        return 96
      case "1m":
        return 60
      default:
        return 30
    }
  }, [])

  return {
    timeframe,
    setTimeframe,
    getDataPointsForTimeframe,
  }
}
