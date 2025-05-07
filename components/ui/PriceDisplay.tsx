// components/ui/PriceDisplay.tsx
// 更新: 価格表示用の共通コンポーネント - Zodバリデーションスキーマを適用

"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { theme } from "@/styles/colors"
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

  return (
    <Badge
      variant="outline"
      className={`font-mono font-bold ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: theme.background.tertiary,
        borderColor: theme.border.light,
        color: theme.text.primary,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {showSymbol && symbol ? `${symbol}: ` : ""}
      {"$"}{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
      className={`font-mono font-bold ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: isPositive ? `${theme.accent.green}20` : `${theme.accent.red}20`,
        borderColor: isPositive ? theme.accent.green : theme.accent.red,
        color: isPositive ? theme.accent.green : theme.accent.red,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      {isPositive && showPlusSign ? '+' : ''}{changePercent.toFixed(2)}%
    </Badge>
  )
}
