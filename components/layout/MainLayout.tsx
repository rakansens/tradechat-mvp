// components/layout/MainLayout.tsx
// 作成: メインレイアウトコンポーネント - モバイルとデスクトップ両方のレイアウトを管理

"use client"

import React from "react"
import { HeaderSection } from "@/components/layout/HeaderSection"
import { ResizableLayout } from "@/components/layout/ResizableLayout"
import { MobileLayout } from "@/components/layout/MobileLayout"
import { theme } from "@/styles/colors"

interface MainLayoutProps {
  // ヘッダー用データ
  currentSymbol: string
  currentPrice: number
  priceChangePercent: number
  
  // コンテンツセクション
  chatSection: React.ReactNode
  chartSection: React.ReactNode
  positionsSection: React.ReactNode
  toolbarSection: React.ReactNode
  
  // UI状態
  activeTab: string
  onTabChange: (value: string) => void
}

export function MainLayout({
  // ヘッダー用データ
  currentSymbol,
  currentPrice,
  priceChangePercent,
  
  // コンテンツセクション
  chatSection,
  chartSection,
  positionsSection,
  toolbarSection,
  
  // UI状態
  activeTab,
  onTabChange
}: MainLayoutProps) {
  return (
    <main className="flex flex-col h-screen" style={{ backgroundColor: theme.background.primary }}>
      <HeaderSection 
        currentSymbol={currentSymbol}
        currentPrice={currentPrice}
        priceChangePercent={priceChangePercent}
      />
      
      <div className="h-full" style={{ backgroundColor: theme.background.primary }}>
        {/* モバイルレイアウト（md以下で表示） */}
        <MobileLayout
          chatSection={chatSection}
          chartSection={chartSection}
          positionsSection={positionsSection}
          toolbarSection={toolbarSection}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        {/* デスクトップレイアウト（md以上で表示） */}
        <ResizableLayout
          chatSection={chatSection}
          chartSection={chartSection}
          positionsSection={positionsSection}
          toolbarSection={toolbarSection}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>
    </main>
  )
}
