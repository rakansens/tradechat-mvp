// app/api/settings/symbols/route.ts
// シンボル設定の取得と更新のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/9/17 - DIパターンを適用（createRouteHandlerClientを使用）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { getSymbolSettings, upsertSymbolSettings, deleteSymbolSettings } from '@/lib/supabase/features/settings';

/**
 * シンボル設定を取得するGETハンドラ
 */
export async function GET() {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を取得（DIパターンでクライアントを渡す）
    const settings = await getSymbolSettings(user.id, supabase);

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings/symbols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * シンボル設定を更新するPUTハンドラ
 */
export async function PUT(request: Request) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // リクエストボディを取得
    const { symbol, favorite, displayOrder } = await request.json();

    // リクエスト検証
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を追加または更新（DIパターンでクライアントを渡す）
    const updatedSetting = await upsertSymbolSettings(
      user.id,
      symbol,
      favorite ?? false,
      displayOrder ?? 0,
      supabase
    );

    return NextResponse.json(updatedSetting);
  } catch (error) {
    console.error('Error in PUT /api/settings/symbols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * シンボル設定を削除するDELETEハンドラ
 */
export async function DELETE(request: Request) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // URL からシンボルパラメータを取得
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を削除（DIパターンでクライアントを渡す）
    await deleteSymbolSettings(user.id, symbol, supabase);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/settings/symbols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 