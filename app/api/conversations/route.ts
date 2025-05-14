// app/api/conversations/route.ts
// 会話一覧と作成のためのAPIエンドポイント
// 作成日: 2025/5/20
// 更新日: 2025/5/27 - データアクセスレイヤーを使用するように変更

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/supabase-auth';
import { getConversations, createConversation } from '@/lib/supabase/supabase-conversations';
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
    const conversations = await getConversations(user.id);
    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error in GET /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const newConversation = await createConversation(
      user.id,
      title,
      system_prompt
    );

    // キャッシュを再検証
    revalidatePath('/chat');

    return NextResponse.json(newConversation);
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 