/**
 * components/position/history/hooks/usePositionActions.ts
 * 
 * ポジションクローズとキャンセルアクションを提供するフック
 * 
 * 変更履歴:
 * - 2023-05-13: PositionHistory.tsxからロジックを抽出
 */

import { useCallback } from "react"
import type { Entry } from "@/types/entry"

/**
 * ポジションのクローズとキャンセルアクションを提供するフック
 * 
 * @param onClosePosition クローズアクションのコールバック
 * @param onCancelPosition キャンセルアクションのコールバック
 * @param getCurrentPrice 現在価格を取得する関数
 * @returns ポジションアクション関数
 */
export function usePositionActions(
  onClosePosition: (entryId: string, exitPrice: number) => void,
  onCancelPosition: (entryId: string) => void,
  getCurrentPrice: (entryPrice: number) => number
) {
  // ポジションをクローズするハンドラー
  const handleClosePosition = useCallback((entry: Entry) => {
    const currentPrice = getCurrentPrice(entry.price)
    onClosePosition(entry.id, currentPrice)
  }, [getCurrentPrice, onClosePosition])

  // ポジションをキャンセルするハンドラー（既存のコールバックを直接使用）
  const handleCancelPosition = useCallback((entryId: string) => {
    onCancelPosition(entryId)
  }, [onCancelPosition])

  return {
    handleClosePosition,
    handleCancelPosition
  }
}

export default usePositionActions 