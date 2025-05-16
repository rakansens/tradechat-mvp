// components/layout/MobileLayout.tsx
// 作成: モバイル表示用のレイアウトコンポーネント

"use client"

import React, { useRef } from "react"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { MobileResizeHandle } from "@/components/ui/MobileResizeHandle"
import { theme } from "@/styles/colors"

interface MobileLayoutProps {
  chatSection: React.ReactNode
  chartSection: React.ReactNode
  positionsSection: React.ReactNode
  toolbarSection: React.ReactNode
  activeTab: string
  onTabChange: (value: string) => void
}

export function MobileLayout({
  chatSection,
  chartSection,
  positionsSection,
  toolbarSection,
  activeTab,
  onTabChange
}: MobileLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col h-full md:hidden" ref={containerRef}>
      <div className="h-1/2 min-h-[200px] overflow-hidden">
        {chatSection}
      </div>
      
      {/* モバイル用リサイズハンドル */}
      <MobileResizeHandle
        containerRef={containerRef}
        onResize={(topHeight, bottomHeight) => {
          // リサイズ後の処理（オプション）
          console.log(`Top height: ${topHeight}px, Bottom height: ${bottomHeight}px`);
        }}
        minTopHeight={150}
        minBottomHeight={150}
      />
      
      <div className="h-1/2 min-h-[200px] overflow-hidden">
        <Card className="h-full flex flex-col border-0 rounded-none shadow-none" style={{ backgroundColor: bg-background-card }}>
          {toolbarSection}
          <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col">
            <TabsContent value="chart" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
              {chartSection}
            </TabsContent>
            <TabsContent value="positions" className="flex-1 m-0 p-0 data-[state=active]:flex flex-col">
              {positionsSection}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
