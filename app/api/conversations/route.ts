// app/api/conversations/route.ts
// 会話一覧と作成のためのAPIエンドポイント
// 作成日: 2025/5/20
// 更新日: 2025/5/27 - データアクセスレイヤーを使用するように変更
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/8/22 - エラーログの詳細表示を追加

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { getConversations, createConversation } from '@/lib/supabase/features/conversations';
import { revalidatePath } from 'next/cache';

// 会話一覧を取得
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // データアクセスレイヤーを使用して会話一覧を取得
    try {
      const conversations = await getConversations(user.id);
      return NextResponse.json(conversations);
    } catch (fetchError) {
      console.error('会話一覧取得エラー詳細:', fetchError);
      return NextResponse.json({ error: `会話一覧取得エラー: ${fetchError}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 });
  }
}

// 新しい会話を作成
export async function POST(request: Request) {
  try {
    // リクエストボディを取得
    const { title, system_prompt } = await request.json();

    // タイトルの検証
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // データアクセスレイヤーを使用して会話を作成
    try {
      const newConversation = await createConversation(
        user.id,
        title,
        system_prompt
      );

      // キャッシュを再検証
      revalidatePath('/chat');

      return NextResponse.json(newConversation);
    } catch (createError) {
      console.error('会話作成エラー詳細:', createError);
      return NextResponse.json({ error: `会話作成エラー: ${createError}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json({ error: `Internal server error: ${error}` }, { status: 500 });
  }
} 