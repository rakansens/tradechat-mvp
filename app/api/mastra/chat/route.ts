// app/api/mastra/chat/route.ts
// システムプロンプトをサポートするMASTRAチャットエンドポイント
// 作成日: 2025/5/28
// 更新日: 2025/9/17 - DIパターンを適用（createRouteHandlerClientを使用）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { askAgent } from '@/lib/agent';
import { MessageRole, ChatMessage } from '@/types/chat/message';

// チャットメッセージを処理するPOSTハンドラー
export async function POST(request: NextRequest) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // リクエストボディを取得
    const { message, messages, instructions } = await request.json();

    // メッセージのバリデーション
    if ((!message && !messages) || (message && typeof message !== 'string') || (messages && !Array.isArray(messages))) {
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // メッセージ形式の統一（単一メッセージか配列か）
    const processedMessages: ChatMessage[] = messages || [
      { role: 'user' as MessageRole, content: message }
    ];

    // エージェントに問い合わせ
    const aiResponse = await askAgent(processedMessages, {
      // 指定がない場合や空文字列の場合はundefinedを維持
      instructions: instructions === '' ? undefined : instructions,
      supabaseClient: supabase
    });

    // 成功レスポンス
    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error('Error in POST /api/mastra/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ヘルスチェック用GETハンドラー
export function GET() {
  return NextResponse.json({ status: 'MASTRA Chat API is up' });
} 