// app/api/conversations/route.ts
// 会話一覧と作成のためのAPIエンドポイント
// 作成日: 2025/5/20

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/supabase-auth';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 会話一覧を取得
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーの会話一覧を取得（更新日時の降順）
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json(data);
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

    // 新しい会話を作成
    const { data, error } = await supabase
      .from('conversations')
      .insert([
        {
          user_id: user.id,
          title,
          system_prompt: system_prompt || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Failed to create conversation:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // キャッシュを再検証
    revalidatePath('/chat');

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 