/**
 * hooks/chart/config/useTimeframe.ts
 * 
 * チャートの時間枠を管理するカスタムフック
 * 時間枠の選択と各時間枠に対するデータポイント数の設定を提供
 *
 * 変更履歴:
 * - 2023-05-15: 初期実装
 * - 2025-05-15: フックのリファクタリングに伴いhooks/chart/configディレクトリに移動
 */

"use client"

import { useState, useCallback } from "react"
import type { Timeframe } from "@/types"

/**
 * チャートの時間枠を管理するフック
 * @returns 時間枠の状態と、時間枠に応じたデータポイント数を計算する関数
 */
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