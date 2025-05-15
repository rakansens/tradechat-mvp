import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { getUserSettings, updateUserSettings } from '@/lib/supabase/features/settings';

/**
 * GET /api/settings - ユーザー設定を取得
 * 更新日: 2025/8/27 - getSession()からgetUser()に切り替え
 * 更新日: 2025/9/17 - DIパターンを適用（createRouteHandlerClientを使用）
 */
export async function GET(req: NextRequest) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // ユーザー設定を取得（DIパターンでクライアントを渡す）
    const settings = await getUserSettings(userId, supabase);
    
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
 * 更新日: 2025/9/17 - DIパターンを適用（createRouteHandlerClientを使用）
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
    
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // 認証チェック
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // ユーザー設定を更新（DIパターンでクライアントを渡す）
    await updateUserSettings(userId, body, supabase);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('設定更新エラー:', error);
    return NextResponse.json(
      { error: '設定の更新中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
} 