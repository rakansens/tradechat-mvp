// components/layout/HeaderSection.tsx
// 作成: ヘッダー部分を抽出したコンポーネント（価格表示含む）

"use client"

import React from "react"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceDisplay, PriceChange } from "@/components/ui/PriceDisplay"
import { theme } from "@/styles/colors"

interface HeaderSectionProps {
  currentSymbol: string
  currentPrice: number
  priceChangePercent: number
}

export function HeaderSection({
  currentSymbol,
  currentPrice,
  priceChangePercent
}: HeaderSectionProps) {
  return (
    <header 
      className="flex justify-between items-center py-2 px-3 border-b" 
      style={{ 
        borderColor: theme.border.light, 
        backgroundColor: theme.background.secondary 
      }}
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">TradeChat Exchange</h1>
        <Badge variant="outline" className="text-xs">BETA</Badge>
        
        {currentPrice > 0 && (
          <div className="flex items-center space-x-2">
            <PriceDisplay 
              price={currentPrice} 
              symbol={currentSymbol} 
              showSymbol={true} 
              size="md"
            />
            
            {priceChangePercent !== 0 && (
              <PriceChange 
                changePercent={priceChangePercent}
                size="md" 
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
        {/* <ThemeToggle /> */}
      </div>
    </header>
  )
}
