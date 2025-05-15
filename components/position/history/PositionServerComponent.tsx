// components/position/history/PositionServerComponent.tsx
// 作成日: 2023/6/26 - サーバーサイドでのデータ取得を担当するコンポーネント

import { Suspense } from "react";
import { getCachedEntriesPaginated, PaginationParams } from "@/lib/supabase/features/entry";
import { fromSupabaseEntry } from "@/types/entry";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// クライアントコンポーネントを動的にインポート
const PositionClientHistory = dynamic(() => import("./PositionClientHistory"), {
  ssr: false
});

// ポジション履歴データを取得するサーバーコンポーネント
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
  
  return (
    <PositionClientHistory
      entries={convertedEntries}
      pagination={{
        totalCount,
        page,
        pageSize,
        hasMore,
      }}
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