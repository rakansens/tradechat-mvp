/**
 * components/position/history/ui/HeaderTabs.tsx
 * 
 * ポジション履歴のヘッダーとタブUIコンポーネント
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxから抽出
 * - 2025-6-26: "all"と"canceled"タブを追加
 * - 2025-6-27: タブにカウンタ表示を追加
 */

"use client"

import { CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { theme } from "@/styles/colors"

// HistoryTabタイプを直接定義(バレルインポートが解決するまでの一時的な対応)
export type HistoryTab = "all" | "open" | "closed" | "canceled"

interface CountsType {
  all: number
  open: number
  closed: number
  canceled: number
}

interface HeaderTabsProps {
  selectedTab: HistoryTab
  onTabChange: (tab: HistoryTab) => void
  counts?: CountsType
}

/**
 * ポジション履歴のヘッダーとタブUIコンポーネント
 * 
 * @param selectedTab 選択中のタブ
 * @param onTabChange タブ変更時のコールバック
 * @param counts 各タブのエントリー数
 */
export function HeaderTabs({ selectedTab, onTabChange, counts }: HeaderTabsProps) {
  // デフォルトカウント値（カウンタがない場合）
  const defaultCounts: CountsType = {
    all: 0,
    open: 0,
    closed: 0,
    canceled: 0
  };

  // 実際に使用するカウント値
  const displayCounts = counts || defaultCounts;

  return (
    <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b" style={{ borderColor: border-border-light }}>
      <CardTitle className="text-base font-medium" style={{ color: text-text-primary }}>Position History</CardTitle>
      <Tabs value={selectedTab} onValueChange={(v) => onTabChange(v as HistoryTab)}>
        <TabsList className="grid grid-cols-4 h-7 border" style={{ backgroundColor: bg-background-tertiary, borderColor: border-border-light }}>
          <TabsTrigger 
            value="all" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white relative"
          >
            All
            {displayCounts.all > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4 min-w-4 absolute -top-1 -right-1 bg-slate-700 text-white">
                {displayCounts.all}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="open" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white relative"
          >
            Open
            {displayCounts.open > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4 min-w-4 absolute -top-1 -right-1 bg-green-600 text-white">
                {displayCounts.open}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="closed" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white relative"
          >
            Closed
            {displayCounts.closed > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4 min-w-4 absolute -top-1 -right-1 bg-blue-600 text-white">
                {displayCounts.closed}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="canceled" 
            className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white relative"
          >
            Canceled
            {displayCounts.canceled > 0 && (
              <Badge variant="secondary" className="ml-1 text-[9px] px-1 h-4 min-w-4 absolute -top-1 -right-1 bg-red-600 text-white">
                {displayCounts.canceled}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </CardHeader>
  )
}

export default HeaderTabs 