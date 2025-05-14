// app/api/settings/chart/route.ts
// チャート設定の取得と更新のためのAPIエンドポイント
// 作成日: 2025/5/14

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/supabase-auth';
import { getChartSettings, updateChartSettings } from '@/lib/supabase/supabase-settings';

/**
 * チャート設定を取得するGETハンドラ
 */
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チャート設定を取得
    const settings = await getChartSettings(user.id);

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

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // チャート設定を更新
    const updatedSettings = await updateChartSettings(user.id, updates);

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error in PUT /api/settings/chart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 