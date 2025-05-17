// components/layout/ResizableLayout.tsx
// 作成: デスクトップ用のリサイズ可能なレイアウトコンポーネント

"use client"

import React from "react"
import { PanelGroup, Panel } from "react-resizable-panels"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ResizeHandle } from "@/components/ui/ResizeHandle"
import { useLayoutState } from "@/hooks/chart"


interface ResizableLayoutProps {
  chatSection: React.ReactNode
  chartSection: React.ReactNode
  positionsSection: React.ReactNode
  toolbarSection: React.ReactNode
  activeTab: string
  onTabChange: (value: string) => void
}

export function ResizableLayout({
  chatSection,
  chartSection,
  positionsSection,
  toolbarSection,
  activeTab,
  onTabChange
}: ResizableLayoutProps) {
  const { 
    initialSizes, 
    minSizes, 
    handleLayoutChange 
  } = useLayoutState({
    storageKey: 'desktopPanelSizes',
    defaultSizes: [30, 70],
    minSizes: [20, 30]
  })

  return (
    <div className="hidden md:block h-full">
      <PanelGroup 
        direction="horizontal" 
        onLayout={handleLayoutChange}
      >
        {/* Chat Panel */}
        <Panel 
          defaultSize={initialSizes[0]} 
          minSize={minSizes[0]}
          className="overflow-hidden"
        >
          {chatSection}
        </Panel>
        
        {/* リサイズハンドル */}
        <ResizeHandle />
        
        {/* Chart/Positions Panel */}
        <Panel 
          defaultSize={initialSizes[1]} 
          minSize={minSizes[1]}
          className="overflow-hidden"
        >
          <Card className="h-full flex flex-col border-0 rounded-none shadow-none bg-background-card">
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
        </Panel>
      </PanelGroup>
    </div>
  )
}
