// app/api/conversations/[id]/route.ts
// 特定の会話を操作するAPIエンドポイント
// 作成日: 2025/5/27
// 更新日: 2025/5/27 - データアクセスレイヤーを使用するように変更
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { 
  getConversation, 
  updateConversation, 
  deleteConversation 
} from '@/lib/supabase/features/conversations';
import { revalidatePath } from 'next/cache';

// 特定の会話を取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // データアクセスレイヤーを使用して会話を取得
      const conversation = await getConversation(conversationId, user.id);
      return NextResponse.json(conversation);
    } catch (error: any) {
      // エラーに応じて適切なレスポンスを返す
      if (error.message && error.message.includes('No rows returned')) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      throw error; // 他のエラーは再スロー
    }
  } catch (error) {
    console.error('Error in GET /api/conversations/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 会話を更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
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

    try {
      // データアクセスレイヤーを使用して会話を更新
      const updatedConversation = await updateConversation(
        conversationId,
        user.id,
        {
          title,
          system_prompt: system_prompt || null
        }
      );

      // キャッシュを再検証
      revalidatePath('/chat');
      revalidatePath(`/chat/${conversationId}`);

      return NextResponse.json(updatedConversation);
    } catch (error: any) {
      // 認証エラー
      if (error.message && error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      // 存在しない会話
      if (error.message && error.message.includes('No rows returned')) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      throw error; // 他のエラーは再スロー
    }
  } catch (error) {
    console.error('Error in PATCH /api/conversations/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 会話を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id;
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // データアクセスレイヤーを使用して会話を削除
      await deleteConversation(conversationId, user.id);

      // キャッシュを再検証
      revalidatePath('/chat');

      return NextResponse.json({ success: true });
    } catch (error: any) {
      // 認証エラー
      if (error.message && error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      // 存在しない会話
      if (error.message && error.message.includes('No rows returned')) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
      throw error; // 他のエラーは再スロー
    }
  } catch (error) {
    console.error('Error in DELETE /api/conversations/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 