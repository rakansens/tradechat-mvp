// app/api/entries/[id]/route.ts
// 特定のトレードエントリーを取得、更新、削除するためのAPIエンドポイント
// 作成日: 2025/5/14

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/supabase-auth';
import {
  getEntryById,
  updateEntry,
  deleteEntry,
  closeEntry
} from '@/lib/supabase/supabase-entry';

// 型情報のインポート（必要に応じて）
import type { EntryUpdateParams } from '@/types/network/supabase';

/**
 * 特定のエントリーを取得するGETハンドラ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // エントリーを取得
    const entry = await getEntryById(id);

    // エントリーが見つからない場合
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // エントリーの所有者を確認（パブリックエントリーの場合は除く）
    if (entry.user_id !== user.id && !entry.is_public) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error(`Error in GET /api/entries/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * エントリーを更新するPUTハンドラ
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // リクエストボディを取得
    const updates = await request.json();

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 更新前にエントリーを取得して所有者を確認
    const entry = await getEntryById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // エントリーの所有者を確認
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // エントリーを更新
    const updatedEntry = await updateEntry(id, updates);

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error(`Error in PUT /api/entries/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * エントリーを削除するDELETEハンドラ
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 削除前にエントリーを取得して所有者を確認
    const entry = await getEntryById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // エントリーの所有者を確認
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // エントリーを削除
    await deleteEntry(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in DELETE /api/entries/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * エントリーをクローズするPATCHハンドラ
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // リクエストボディを取得
    const { closePrice, closeTime } = await request.json();

    // バリデーション
    if (!closePrice) {
      return NextResponse.json(
        { error: 'Close price is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // クローズ前にエントリーを取得して所有者を確認
    const entry = await getEntryById(id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // エントリーの所有者を確認
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // クローズ時間が提供されていない場合は現在時刻を使用
    const closeAt = closeTime ? new Date(closeTime) : new Date();

    // エントリーをクローズ
    const closedEntry = await closeEntry(id, closePrice, closeAt);

    return NextResponse.json(closedEntry);
  } catch (error) {
    console.error(`Error in PATCH /api/entries/${params.id}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 