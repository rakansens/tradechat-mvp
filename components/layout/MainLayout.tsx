// components/layout/MainLayout.tsx
// 作成: メインレイアウトコンポーネント - モバイルとデスクトップ両方のレイアウトを管理
// 更新: 2025/5/16 - 背景色の設定を修正

"use client"

import React from "react"
import { HeaderSection } from "@/components/layout/HeaderSection"
import { ResizableLayout } from "@/components/layout/ResizableLayout"
import { MobileLayout } from "@/components/layout/MobileLayout"


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
    <main className="flex flex-col h-screen bg-background">
      <HeaderSection 
        currentSymbol={currentSymbol}
        currentPrice={currentPrice}
        priceChangePercent={priceChangePercent}
      />
      
      <div className="h-full bg-background">
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
