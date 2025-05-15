// app/api/memories/route.ts
// メモリ管理API
// 作成日: 2025/5/31
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/8/22 - エラーログの詳細表示を追加

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { 
  getUserMemories, 
  createMemory, 
  searchMemoriesBySimilarity,
  searchMemoriesByText,
  deleteMemory 
} from '@/lib/supabase/features/memory';

/**
 * メモリ一覧を取得するGETハンドラ
 * @param request リクエスト
 * @returns メモリ一覧
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const searchQuery = searchParams.get('q');
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 検索クエリが指定されている場合は検索、それ以外は全件取得
    if (searchQuery) {
      // まずはベクトル検索で試す
      try {
        const memories = await searchMemoriesBySimilarity(user.id, searchQuery, limit);
        return NextResponse.json(memories);
      } catch (error) {
        console.error('ベクトル検索エラー:', error);
        
        // ベクトル検索に失敗した場合はテキスト検索にフォールバック
        try {
          const memories = await searchMemoriesByText(user.id, searchQuery, limit);
          return NextResponse.json(memories);
        } catch (textError) {
          console.error('テキスト検索エラー:', textError);
          return NextResponse.json({ error: `検索エラー: ${textError}` }, { status: 500 });
        }
      }
    } else {
      // 全件取得
      try {
        const memories = await getUserMemories(user.id, limit, offset);
        return NextResponse.json(memories);
      } catch (fetchError) {
        console.error('メモリ取得エラー:', fetchError);
        return NextResponse.json({ error: `メモリ取得エラー: ${fetchError}` }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error in GET /api/memories:', error);
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 });
  }
}

/**
 * メモリを作成するPOSTハンドラ
 * @param request リクエスト
 * @returns 作成されたメモリ
 */
export async function POST(request: Request) {
  try {
    // リクエストボディを取得
    const { content, externalId, metadata } = await request.json();
    
    // コンテンツのバリデーション
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      );
    }
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // メモリを作成
    const memory = await createMemory(
      user.id,
      content,
      externalId,
      metadata || {}
    );
    
    return NextResponse.json(memory);
  } catch (error) {
    console.error('Error in POST /api/memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * メモリを削除するDELETEハンドラ
 * @param request リクエスト
 * @returns 削除結果
 */
export async function DELETE(request: NextRequest) {
  try {
    // クエリパラメータでメモリIDを取得
    const searchParams = request.nextUrl.searchParams;
    const memoryId = searchParams.get('id');
    
    if (!memoryId) {
      return NextResponse.json(
        { error: 'Memory ID is required' },
        { status: 400 }
      );
    }
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // メモリを削除
    await deleteMemory(memoryId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/memories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 