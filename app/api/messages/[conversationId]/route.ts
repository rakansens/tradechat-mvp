// app/api/messages/[conversationId]/route.ts
// 会話ごとのメッセージ取得と送信のためのAPIエンドポイント
// 作成日: 2025/5/20
// 更新日: 2025/8/28 - Route Handler用のSupabaseClientを使用するよう修正

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { askAgent } from '@/lib/agent';
import { revalidatePath } from 'next/cache';
import { MessageRole } from '@/types/chat/message';

// 指定された会話のメッセージを取得
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 会話IDのバリデーション
    const { conversationId } = params;
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    // SSR対応Supabaseクライアントを生成
    const supabase = await createRouteHandlerClient();

    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 会話が存在するか、かつ現在のユーザーのものかを確認
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 会話のメッセージを取得（作成日時の昇順）
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*, chat_images(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    });
  } catch (error) {
    console.error(`Error in GET /api/messages/${params.conversationId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// メッセージを送信し、AIからの応答を取得
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    // 会話IDのバリデーション
    const { conversationId } = params;
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }

    // SSR対応Supabaseクライアントを生成
    const supabase = await createRouteHandlerClient();

    // リクエストボディを取得
    const { message, image_data, image_caption } = await request.json();

    // メッセージのバリデーション
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 会話が存在するか、かつ現在のユーザーのものかを確認
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let imageId = null;

    // 画像がある場合は保存
    if (image_data) {
      const { data: imageData, error: imageError } = await supabase
        .from('chat_images')
        .insert([
          {
            user_id: user.id,
            image_data,
            image_caption,
          },
        ])
        .select()
        .single();

      if (imageError) {
        console.error('Failed to save image:', imageError);
      } else {
        imageId = imageData.id;
      }
    }

    // ユーザーメッセージを保存
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content: message,
          image_id: imageId,
        },
      ])
      .select()
      .single();

    if (userMessageError) {
      console.error('Failed to save user message:', userMessageError);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // 会話の最新20件のメッセージを取得
    const { data: recentMessages, error: recentMessagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    if (recentMessagesError) {
      console.error('Failed to fetch recent messages:', recentMessagesError);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    // Mastraエージェントに問い合わせ
    const aiResponse = await askAgent(
      recentMessages.map((msg) => ({
        role: msg.role as MessageRole,
        content: msg.content,
      })),
      {
        threadId: conversationId,
        instructions: conversation.system_prompt === null ? undefined : conversation.system_prompt,
      }
    );

    // AIの応答を保存
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse.content,
        },
      ]);

    if (aiMessageError) {
      console.error('Failed to save AI response:', aiMessageError);
      return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 });
    }

    // 会話の更新日時を更新
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (updateError) {
      console.error('Failed to update conversation timestamp:', updateError);
    }

    // キャッシュを再検証
    revalidatePath(`/chat/${conversationId}`);

    return NextResponse.json({
      success: true,
      userMessage,
      aiResponse,
    });
  } catch (error) {
    console.error(`Error in POST /api/messages/${params.conversationId}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 