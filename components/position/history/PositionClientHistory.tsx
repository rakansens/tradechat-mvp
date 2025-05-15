"use client"

/**
 * components/position/history/PositionClientHistory.tsx
 *
 * Client-side renderer for position history.
 * - Receives paginated entry data from the server component
 * - Uses local hooks (useHistoryTabs / usePriceSimulator / usePositionActions)
 *   to handle UI state, price simulation, and action callbacks
 * - Renders the entry list and handles client-side pagination controls
 * - Fetches new data from API when page changes
 */

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { theme } from "@/styles/colors"
import type { Entry } from "@/types/entry"
import { useHistoryTabs, HistoryTab, usePriceSimulator, usePositionActions } from "./hooks"
import { HeaderTabs } from "./ui/HeaderTabs"
import { EntryList } from "./ui/EntryList"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// ページネーション情報の型
interface PaginationInfo {
  totalCount: number
  page: number
  pageSize: number
  hasMore: boolean
}

// APIレスポンスの型
interface PositionsResponse {
  data: Entry[]
  pagination: PaginationInfo
}

interface PositionClientHistoryProps {
  entries: Entry[]          // 初期データ（SSR）
  pagination: PaginationInfo // 初期ページネーション情報（SSR）
}

/**
 * ポジション履歴のクライアントコンポーネント
 * サーバーコンポーネントから受け取ったデータを元にUIを構築
 * ページ変更時にAPIからデータを取得
 */
export function PositionClientHistory({
  entries: initialEntries,
  pagination: initialPagination,
}: PositionClientHistoryProps) {
  // データ状態
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  // タブの状態とフィルタリング
  const { selectedTab, setSelectedTab, filteredEntries } = useHistoryTabs(entries)
  
  // 価格シミュレーション
  const getCurrentPrice = usePriceSimulator()
  
  // APIアクション用コールバック定義
  const handleClose = (entryId: string, exitPrice: number) => {
    console.log(`Close position: ${entryId} at price: ${exitPrice}`)
    // 実際の実装ではAPIを呼び出す
  }
  
  const handleCancel = (entryId: string) => {
    console.log(`Cancel position: ${entryId}`)
    // 実際の実装ではAPIを呼び出す
  }
  
  // ポジションアクション - EntryListコンポーネントの期待する形式に合わせる
  const { handleClosePosition, handleCancelPosition } = usePositionActions(
    handleClose,
    handleCancel,
    getCurrentPrice
  )

  // APIからデータを取得する関数
  const fetchPositions = useCallback(async (page: number, status?: string) => {
    setIsFetching(true)
    setFetchError(null)
    
    try {
      // クエリパラメータを構築
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pagination.pageSize.toString()
      })
      
      // ステータスがある場合は追加
      if (status && status !== 'all') {
        params.append('status', status)
      }
      
      // APIリクエスト
      const response = await fetch(`/api/positions?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }
      
      // レスポンスデータを取得
      const data: PositionsResponse = await response.json()
      
      // 状態を更新
      setEntries(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch positions:', error)
      setFetchError('データの取得に失敗しました。もう一度お試しください。')
    } finally {
      setIsFetching(false)
    }
  }, [pagination.pageSize])

  // ページ変更処理
  const handlePageChange = (newPage: number) => {
    if (isFetching) return
    
    const { totalCount, pageSize } = pagination
    const totalPages = Math.ceil(totalCount / pageSize)
    
    if (newPage >= 1 && newPage <= totalPages) {
      // APIからデータ取得
      fetchPositions(newPage, selectedTab !== 'all' ? selectedTab : undefined)
    }
  }

  // タブ変更時にページをリセットしてデータ取得
  useEffect(() => {
    // 初期ロード時は無視（すでにデータがあるため）
    if (entries === initialEntries) return
    
    fetchPositions(1, selectedTab !== 'all' ? selectedTab : undefined)
  }, [selectedTab, fetchPositions, entries, initialEntries])

  // ページネーション計算
  const { page, pageSize, totalCount, hasMore } = pagination
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <Card className="border" style={{ borderColor: theme.border.light }}>
      {/* ヘッダーとタブ */}
      <HeaderTabs 
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
      
      {/* エラー表示 */}
      {fetchError && (
        <div className="p-4 text-center text-red-500 text-sm">
          {fetchError}
        </div>
      )}
      
      {/* エントリーリスト */}
      {isFetching ? (
        <div className="p-4 space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <EntryList 
          entries={filteredEntries}
          getCurrentPrice={getCurrentPrice}
          onClosePosition={handleClosePosition}
          onCancelPosition={handleCancelPosition}
        />
      )}
      
      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            前へ
          </Button>
          
          <div className="text-sm text-gray-600">
            {page} / {totalPages} ページ
            （全{totalCount}件）
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore || isFetching}
          >
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  )
}

// デフォルトエクスポート
export default PositionClientHistory; 