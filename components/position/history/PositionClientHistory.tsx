"use client"

/**
 * components/position/history/PositionClientHistory.tsx
 *
 * Client-side renderer for position history.
 * - Uses React Query's useInfiniteQuery for efficient data fetching and pagination
 * - Handles UI state with local hooks (useHistoryTabs / usePriceSimulator / usePositionActions)
 * - Renders the entry list with pagination controls
 * 
 * 作成日: 2025/6/26
 * 更新日: 2025/6/29 - HydrationBoundaryサポートを追加
 */

import { useState, useEffect } from "react"
import { useInfiniteQuery, useQueryClient, HydrationBoundary } from "@tanstack/react-query"
import { Card } from "@/components/ui/card"

import type { Entry } from "@/types/entry"
import { useHistoryTabs, usePriceSimulator, usePositionActions } from "./hooks"
import { fetchJSON } from "@/utils/fetcher"
import { HeaderTabs } from "./ui/HeaderTabs"
import { EntryList } from "./ui/EntryList"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { HistoryTab } from "./hooks/useHistoryTabs"
import type { DehydratedState } from "@tanstack/react-query"

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

// 1ページあたりの表示件数
const PAGE_SIZE = 10;

interface PositionClientHistoryProps {
  entries: Entry[]          // 初期データ（SSR）
  pagination: PaginationInfo // 初期ページネーション情報（SSR）
  dehydratedState?: DehydratedState // React Queryの状態（サーバーからdehydrate）
}

/**
 * ポジション履歴のクライアントコンポーネント内部実装
 * dehydratedStateを使わず、直接useInfiniteQueryを使用
 */
function PositionHistoryInner({
  entries: initialEntries,
  pagination: initialPagination,
}: Omit<PositionClientHistoryProps, 'dehydratedState'>) {
  // タブの状態
  const [selectedTab, setSelectedTab] = useState<HistoryTab>("open");

  // React Query: 無限スクロールクエリの設定
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    isLoading,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['positions', selectedTab],
    queryFn: async ({ pageParam = 1 }) => {
      // クエリパラメータを構築
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: String(PAGE_SIZE)
      });
      
      // ステータスがある場合は追加
      if (selectedTab && selectedTab !== 'all') {
        params.append('status', selectedTab);
      }
      
      // APIからデータを取得
      return fetchJSON<PositionsResponse>(`/api/positions?${params.toString()}`);
    },
    initialPageParam: 1,
    // タブがopenの場合のみ初期データを使用（他のタブではフェッチからスタート）
    initialData: selectedTab === 'open' 
      ? {
          pages: [{ data: initialEntries, pagination: initialPagination }],
          pageParams: [1]
        }
      : undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.pagination.page > 1 ? firstPage.pagination.page - 1 : undefined;
    },
    staleTime: 10000, // 10秒間はキャッシュデータを使用
  });

  // データの展開と整形
  const allEntries = data?.pages.flatMap(page => page.data) || [];
  const currentPage = data?.pages[data.pages.length - 1].pagination.page || 1;
  const totalPages = data?.pages[data.pages.length - 1].pagination.totalCount
    ? Math.ceil(data.pages[data.pages.length - 1].pagination.totalCount / PAGE_SIZE)
    : 1;
  const totalCount = data?.pages[data.pages.length - 1].pagination.totalCount || 0;
  
  // タブの状態とフィルタリング
  const { filteredEntries, counts } = useHistoryTabs(allEntries);
  
  // React Query クライアントへの参照を取得
  const queryClient = useQueryClient();
  
  // タブ選択変更時の処理
  const handleTabChange = (tab: HistoryTab) => {
    // タブが変更されたら、現在のクエリを完全に無効化してリフェッチ
    if (tab !== selectedTab) {
      setSelectedTab(tab);
      // 少し遅延させてタブ変更後にクエリを無効化
      setTimeout(() => {
        queryClient.resetQueries({ queryKey: ['positions', tab] });
      }, 10);
    }
  };
  
  // 価格シミュレーション
  const getCurrentPrice = usePriceSimulator();
  
  // APIアクション用コールバック定義
  const handleClose = (entryId: string, exitPrice: number) => {
    console.log(`Close position: ${entryId} at price: ${exitPrice}`);
    // 実際の実装ではAPIを呼び出す
  };
  
  const handleCancel = (entryId: string) => {
    console.log(`Cancel position: ${entryId}`);
    // 実際の実装ではAPIを呼び出す
  };
  
  // ポジションアクション - EntryListコンポーネントの期待する形式に合わせる
  const { handleClosePosition, handleCancelPosition } = usePositionActions(
    handleClose,
    handleCancel,
    getCurrentPrice
  );

  return (
    <Card className="border border-border-light">
      {/* ヘッダーとタブ */}
      <HeaderTabs 
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        counts={counts}
      />
      
      {/* エラー表示 */}
      {isError && (
        <div className="p-4 text-center text-red-500 text-sm">
          {error instanceof Error ? error.message : 'データの取得に失敗しました。もう一度お試しください。'}
        </div>
      )}
      
      {/* エントリーリスト */}
      {isLoading ? (
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
            onClick={() => fetchPreviousPage()}
            disabled={!hasPreviousPage || isFetchingPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            前へ
          </Button>
          
          <div className="text-sm text-gray-600">
            {currentPage} / {totalPages} ページ
            （全{totalCount}件）
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
          >
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </Card>
  )
}

/**
 * ポジション履歴のクライアントコンポーネント（メインエクスポート）
 * サーバーから受け取ったdehydratedStateでHydrationBoundaryをラップ
 */
export function PositionClientHistory({
  entries,
  pagination,
  dehydratedState
}: PositionClientHistoryProps) {
  // サーバーからのdehydratedStateがある場合はHydrationBoundaryを使用
  if (dehydratedState) {
    return (
      <HydrationBoundary state={dehydratedState}>
        <PositionHistoryInner entries={entries} pagination={pagination} />
      </HydrationBoundary>
    );
  }
  
  // dehydratedStateがない場合は直接内部コンポーネントを使用
  return <PositionHistoryInner entries={entries} pagination={pagination} />;
}

// デフォルトエクスポート
export default PositionClientHistory; 