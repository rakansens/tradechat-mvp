// app/api/settings/chart/route.ts
// チャート設定の取得と更新のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/9/17 - DI対応（createRouteHandlerClientの使用）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { getChartSettings, updateChartSettings } from '@/lib/supabase/features/settings';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';

/**
 * チャート設定を取得するGETハンドラ
 */
export async function GET() {
  try {
    // Route Handler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チャート設定を取得
    const settings = await getChartSettings(user.id, supabase);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings/chart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * チャート設定を更新するPUTハンドラ
 */
export async function PUT(request: Request) {
  try {
    // リクエストボディを取得
    const updates = await request.json();
    
    // Route Handler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();

    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チャート設定を更新
    const updatedSettings = await updateChartSettings(user.id, updates, supabase);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error in PUT /api/settings/chart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 