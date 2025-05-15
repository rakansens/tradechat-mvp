/**
 * app/api/positions/route.ts
 * 
 * ポジション履歴データを取得するAPIルート
 * - 認証済みユーザーの履歴を取得
 * - ページネーション、フィルタリングをサポート
 * 
 * 作成日: 2025/6/26
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { getCachedEntriesPaginated, PaginationParams } from '@/lib/supabase/features/entry';
import { fromSupabaseEntry } from '@/types/entry';

export async function GET(request: NextRequest) {
  // URLパラメータを取得
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const status = searchParams.get('status') as 'open' | 'closed' | 'canceled' | undefined;
  const symbol = searchParams.get('symbol') || undefined;
  
  // Supabaseクライアントを初期化（ルートハンドラー用）
  const supabase = createRouteHandlerClient();
  
  // 認証セッションを取得
  const { data: { session } } = await supabase.auth.getSession();
  
  // 未認証なら401エラー
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    // ページネーション用パラメータを準備
    const params: PaginationParams = {
      page,
      pageSize,
      status,
      symbol,
      userId: session.user.id,
    };
    
    // エントリーデータを取得（キャッシュ付き）
    const paginatedEntries = await getCachedEntriesPaginated(params);
    
    // Supabase型からクライアント型に変換
    const convertedEntries = paginatedEntries.data.map(entry => fromSupabaseEntry(entry));
    
    // レスポンスを作成
    const response = NextResponse.json({
      data: convertedEntries,
      pagination: {
        totalCount: paginatedEntries.totalCount,
        page: paginatedEntries.page,
        pageSize: paginatedEntries.pageSize,
        hasMore: paginatedEntries.hasMore
      }
    });
    
    // キャッシュヘッダーを設定 (5秒間CDNキャッシュ、30秒間は古いデータを表示しながら再検証)
    response.headers.set('Cache-Control', 's-maxage=5, stale-while-revalidate=30');
    
    return response;
  } catch (error) {
    console.error('Error fetching position data:', error);
    return NextResponse.json(
      { error: "Failed to fetch position data" },
      { status: 500 }
    );
  }
} 