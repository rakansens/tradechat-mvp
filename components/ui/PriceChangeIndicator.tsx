// components/ui/PriceChangeIndicator.tsx
// 作成: 価格変動を表示するインジケーターコンポーネント

import { Badge } from "@/components/ui/badge"

interface PriceChangeIndicatorProps {
  currentPrice: number;
  previousPrice: number;
}

/**
 * 価格変動を表示するインジケーターコンポーネント
 * 変動率をパーセンテージで表示し、上昇/下降に応じて色を変える
 */
export default function PriceChangeIndicator({ currentPrice, previousPrice }: PriceChangeIndicatorProps) {
  const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100
  const isPositive = percentChange >= 0

  return (
    <Badge variant={isPositive ? "success" : "destructive"} className="font-mono bg-opacity-20 border border-opacity-50">
      {isPositive ? "+" : ""}
      {percentChange.toFixed(2)}%
    </Badge>
  )
}
