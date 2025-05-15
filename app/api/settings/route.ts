import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUserSettings, updateUserSettings } from '@/lib/supabase/features/settings';

/**
 * GET /api/settings - ユーザー設定を取得
 * 更新日: 2025/8/27 - getSession()からgetUser()に切り替え
 */
export async function GET(req: NextRequest) {
  try {
    // サーバーサイドでのSupabaseクライアント作成 (非同期に変更)
    const supabaseServer = await createServerClient();
    
    // 認証チェック - getUser()を使用
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // ユーザー設定を取得
    const settings = await getUserSettings(userId);
    
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('設定取得エラー:', error);
    return NextResponse.json(
      { error: '設定の取得中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings - ユーザー設定を更新
 * 更新日: 2025/8/27 - getSession()からgetUser()に切り替え
 */
export async function POST(req: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: '無効なリクエストボディです' }, 
        { status: 400 }
      );
    }
    
    // サーバーサイドでのSupabaseクライアント作成（非同期に変更）
    const supabaseServer = await createServerClient();
    
    // 認証チェック - getUser()を使用
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // ユーザー設定を更新
    await updateUserSettings(userId, body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('設定更新エラー:', error);
    return NextResponse.json(
      { error: '設定の更新中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
} 