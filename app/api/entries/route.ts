// app/api/entries/route.ts
// トレードエントリー一覧取得と作成のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { getUserEntries, createEntry } from '@/lib/supabase/features/entry';

/**
 * ユーザーのエントリー一覧を取得するGETハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのエントリー一覧を取得
    const entries = await getUserEntries(user.id, limit, offset);

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error in GET /api/entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 新しいエントリーを作成するPOSTハンドラ
 */
export async function POST(request: Request) {
  try {
    // リクエストボディを取得
    const { side, symbol, price, time, takeProfit, stopLoss, isPublic } = await request.json();

    // 必須パラメータのバリデーション
    if (!side || !symbol || !price) {
      return NextResponse.json(
        { error: 'Side, symbol, and price are required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // タイムスタンプが提供されていない場合は現在時刻を使用
    const entryTime = time ? new Date(time) : new Date();

    // 新しいエントリーを作成
    const entry = await createEntry(
      user.id,
      side,
      symbol,
      price,
      entryTime,
      takeProfit,
      stopLoss,
      isPublic || false
    );

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error in POST /api/entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 