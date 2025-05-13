/**
 * components/position/history/PositionHistory.tsx
 * 
 * ポジション履歴を表示するメインコンポーネント
 * Hook+UIアーキテクチャによる再構築バージョン
 * 
 * 変更履歴:
 * - 2023-05-13: フックとUIコンポーネントに分割してリファクタリング
 */

"use client"

import { Card } from "@/components/ui/card"
import { theme } from "@/styles/colors"
import type { Entry } from "@/types/entry"
import { 
  useHistoryTabs, 
  usePriceSimulator, 
  usePositionActions 
} from "@/hooks/position"
import { HeaderTabs } from "./ui/HeaderTabs"
import { EntryList } from "./ui/EntryList"

interface PositionHistoryProps {
  entries: Entry[]
  onClosePosition: (entryId: string, exitPrice: number) => void
  onCancelPosition: (entryId: string) => void
}

/**
 * ポジション履歴を表示するメインコンポーネント
 * 
 * @param entries すべてのエントリー配列
 * @param onClosePosition クローズアクションのコールバック
 * @param onCancelPosition キャンセルアクションのコールバック
 */
export function PositionHistory({
  entries,
  onClosePosition,
  onCancelPosition,
}: PositionHistoryProps) {
  // タブの状態とフィルタリング
  const { selectedTab, setSelectedTab, filteredEntries } = useHistoryTabs(entries)
  
  // 価格シミュレーション
  const getCurrentPrice = usePriceSimulator()
  
  // ポジションアクション
  const { handleClosePosition, handleCancelPosition } = usePositionActions(
    onClosePosition,
    onCancelPosition,
    getCurrentPrice
  )

  return (
    <Card className="border" style={{ borderColor: theme.border.light }}>
      {/* ヘッダーとタブ */}
      <HeaderTabs 
        selectedTab={selectedTab} 
        onTabChange={setSelectedTab} 
      />
      
      {/* エントリーリスト */}
      <EntryList 
        entries={filteredEntries}
        getCurrentPrice={getCurrentPrice}
        onClosePosition={handleClosePosition}
        onCancelPosition={handleCancelPosition}
      />
    </Card>
  )
}

export default PositionHistory 