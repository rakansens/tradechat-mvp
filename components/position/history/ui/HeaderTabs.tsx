/**
 * components/position/history/ui/HeaderTabs.tsx
 * 
 * ポジション履歴のヘッダーとタブUIコンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 */

"use client"

import { CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { theme } from "@/styles/colors"
import type { HistoryTab } from "@/components/position/history/hooks/useHistoryTabs"

interface HeaderTabsProps {
  selectedTab: HistoryTab
  onTabChange: (tab: HistoryTab) => void
}

/**
 * ポジション履歴のヘッダーとタブUIコンポーネント
 * 
 * @param selectedTab 選択中のタブ
 * @param onTabChange タブ変更時のコールバック
 */
export function HeaderTabs({ selectedTab, onTabChange }: HeaderTabsProps) {
  return (
    <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b" style={{ borderColor: theme.border.light }}>
      <CardTitle className="text-base font-medium" style={{ color: theme.text.primary }}>Position History</CardTitle>
      <Tabs value={selectedTab} onValueChange={(v) => onTabChange(v as HistoryTab)}>
        <TabsList className="grid grid-cols-2 h-7 border" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light }}>
          <TabsTrigger 
            value="open" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white"
          >
            Open
          </TabsTrigger>
          <TabsTrigger 
            value="closed" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white"
          >
            Closed
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </CardHeader>
  )
}

export default HeaderTabs 