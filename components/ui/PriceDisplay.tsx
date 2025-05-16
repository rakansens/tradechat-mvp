// components/ui/PriceDisplay.tsx
// 更新: 価格表示用の共通コンポーネント - Zodバリデーションスキーマを適用
// 更新: 2025-06-28 - インラインスタイルをTailwindクラスに変更

"use client"

import React, { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  PriceDisplayProps,
  PriceChangeProps,
  priceDisplaySchema,
  priceChangeSchema
} from "@/lib/validations/price"

export function PriceDisplay({
  price,
  symbol,
  showSymbol = false,
  className = "",
  size = "md"
}: PriceDisplayProps) {
  // クライアントサイドレンダリングのためのステート
  const [isClient, setIsClient] = useState(false)
  
  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // 入力値のバリデーション（開発環境のみ）
  if (process.env.NODE_ENV !== 'production') {
    const result = priceDisplaySchema.safeParse({ price, symbol, showSymbol, className, size })
    if (!result.success) {
      console.warn('PriceDisplay: Invalid props', result.error)
    }
  }
  
  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2",
    lg: "text-base py-1.5 px-2.5"
  }

  // サーバーサイドレンダリングとクライアントサイドレンダリングで一貫した出力を保証
  const formattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  return (
    <Badge
      variant="outline"
      className={cn(
        `font-mono font-bold ${sizeClasses[size]} bg-background-tertiary border-border-light text-text-primary shadow-md`,
        className
      )}
    >
      <span suppressHydrationWarning>
        {isClient && showSymbol && symbol ? `${symbol}: ` : ""}
        ${formattedPrice}
      </span>
    </Badge>
  )
}

export function PriceChange({
  changePercent,
  className = "",
  size = "md",
  showPlusSign = true
}: PriceChangeProps) {
  // 入力値のバリデーション（開発環境のみ）
  if (process.env.NODE_ENV !== 'production') {
    const result = priceChangeSchema.safeParse({ changePercent, className, size, showPlusSign })
    if (!result.success) {
      console.warn('PriceChange: Invalid props', result.error)
    }
  }
  const sizeClasses = {
    sm: "text-xs py-0.5 px-1.5",
    md: "text-sm py-1 px-2",
    lg: "text-base py-1.5 px-2.5"
  }

  const isPositive = changePercent >= 0

  return (
    <Badge 
      className={cn(
        `font-mono font-bold ${sizeClasses[size]} shadow-md`,
        isPositive 
          ? "bg-accent-green/10 border border-accent-green text-accent-green" 
          : "bg-accent-red/10 border border-accent-red text-accent-red",
        className
      )}
    >
      {isPositive && showPlusSign ? '+' : ''}{changePercent.toFixed(2)}%
    </Badge>
  )
}
