// app/api/settings/symbols/route.ts
// シンボル設定の取得と更新のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { getSymbolSettings, upsertSymbolSettings, deleteSymbolSettings } from '@/lib/supabase/features/settings';

/**
 * シンボル設定を取得するGETハンドラ
 */
export async function GET() {
  try {
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を取得
    const settings = await getSymbolSettings(user.id);

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
    // リクエストボディを取得
    const { symbol, isFavorite, displayOrder } = await request.json();

    // リクエスト検証
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を追加または更新
    const updatedSetting = await upsertSymbolSettings(
      user.id,
      symbol,
      isFavorite ?? false,
      displayOrder ?? 0
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
    // URL からシンボルパラメータを取得
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // シンボル設定を削除
    await deleteSymbolSettings(user.id, symbol);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/settings/symbols:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 