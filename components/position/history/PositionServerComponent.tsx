// components/position/history/PositionServerComponent.tsx
// 作成日: 2023/6/26 - サーバーサイドでのデータ取得を担当するコンポーネント
// 更新日: 2025/6/29 - React Query Prefetch & Hydrationを追加

import { Suspense } from "react";
import { getCachedEntriesPaginated, PaginationParams } from "@/lib/supabase/features/entry";
import { fromSupabaseEntry } from "@/types/entry";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/components/providers/ReactQueryProvider";
import type { Entry } from "@/types/entry";

// 型定義
interface PositionsResponse {
  data: Entry[];
  pagination: {
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

// クライアントコンポーネントを動的にインポート（Hydration対応版）
const PositionClientHistory = dynamic(() => import("./PositionClientHistory"), {
  ssr: false
});

/**
 * サーバーサイドでデータを取得し、React QueryでPrefetch & Hydrationする
 * クライアントコンポーネントにdehydratedStateを渡す
 */
async function PositionHistoryData({
  params,
  userId,
}: {
  params: PaginationParams;
  userId?: string;
}) {
  // データ取得
  const paginatedEntries = await getCachedEntriesPaginated({
    ...params,
    userId,
  });

  // Supabaseの型からクライアント型に変換
  const convertedEntries = paginatedEntries.data.map(entry => fromSupabaseEntry(entry));
  
  // メタデータも渡す
  const { totalCount, page, pageSize, hasMore } = paginatedEntries;
  
  // サーバーサイドでReact QueryクライアントにPrefetch
  const queryClient = getQueryClient();
  
  // 応答データの構造
  const responseData: PositionsResponse = {
    data: convertedEntries,
    pagination: {
      totalCount,
      page,
      pageSize,
      hasMore
    }
  };
  
  // デフォルトタブ（open）のデータをprefetch
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['positions', 'open'],
    queryFn: async ({ pageParam = 1 }) => {
      // 実際の実装ではAPIを呼び出すが、ここではサーバーデータを返す
      return responseData;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined;
    }
  });
  
  // クエリ状態をdehydrate（シリアライズ）
  const dehydratedState = dehydrate(queryClient);
  
  return (
    <PositionClientHistory
      entries={convertedEntries}
      pagination={{
        totalCount,
        page,
        pageSize,
        hasMore,
      }}
      dehydratedState={dehydratedState}
    />
  );
}

// 外部から利用するメインコンポーネント
// Suspenseでラップしてローディング状態を表示
export function PositionServerHistory({
  params = { page: 1, pageSize: 10 },
  userId,
}: {
  params?: PaginationParams;
  userId?: string;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <PositionHistoryData params={params} userId={userId} />
    </Suspense>
  );
}

// デフォルトエクスポート（ファイル外からのインポートを簡単にするため）
export default PositionServerHistory; 