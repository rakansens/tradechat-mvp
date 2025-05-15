// app/api/memories/similarity/route.ts
// メモリのベクトル類似度検索API
// 作成日: 2025/6/1
// 更新日: 2025/8/22 - エラーログの詳細表示を追加

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { searchMemoriesBySimilarity } from '@/lib/supabase/features/memory';

/**
 * ベクトル類似度に基づくメモリ検索APIハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    
    if (!query) {
      return NextResponse.json(
        { error: '検索クエリが必要です' },
        { status: 400 }
      );
    }
    
    // 認証されたユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    // 検索結果の上限数を決定（デフォルト10件）
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    
    // ベクトル類似度検索を実行
    try {
      const memories = await searchMemoriesBySimilarity(user.id, query, limit);
      return NextResponse.json(memories);
    } catch (searchError) {
      console.error('類似度検索エラー詳細:', searchError);
      return NextResponse.json(
        { error: `メモリ類似度検索中にエラーが発生しました: ${searchError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('メモリ検索エラー:', error);
    return NextResponse.json(
      { error: `メモリ検索中にエラーが発生しました: ${error}` },
      { status: 500 }
    );
  }
} 