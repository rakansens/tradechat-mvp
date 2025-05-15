// app/api/entries/[id]/route.ts
// IDを指定したトレードエントリー操作のためのAPIエンドポイント
// 作成日: 2025/6/1
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/9/17 - DIパターンを適用（createRouteHandlerClientを使用）

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { 
  updateEntry, 
  deleteEntry, 
  closeEntry, 
  cancelEntry,
  getEntryById 
} from '@/lib/supabase/features/entry';

/**
 * 特定のエントリーを取得するGETハンドラ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    const entryId = params.id;
    
    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // エントリーを取得（DIパターンでクライアントを渡す）
    const entry = await getEntryById(entryId, supabase);
    
    // エントリーが存在しない場合
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    // 自分のエントリーかどうかをチェック（公開エントリーは誰でも見られる）
    if (entry.user_id !== user.id && !entry.is_public) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error in GET /api/entries/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * エントリーを更新するPATCHハンドラ
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    const entryId = params.id;
    
    // リクエストボディを取得
    const updates = await request.json();
    
    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // まずエントリーを取得して所有者チェック（DIパターンでクライアントを渡す）
    const entry = await getEntryById(entryId, supabase);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // 特殊なアクションの処理
    if (updates.action) {
      if (updates.action === 'close' && updates.exitPrice) {
        const exitPrice = parseFloat(updates.exitPrice);
        if (isNaN(exitPrice)) {
          return NextResponse.json({ error: 'Invalid exit price' }, { status: 400 });
        }
        
        const exitTime = updates.exitTime ? new Date(updates.exitTime) : new Date();
        const updatedEntry = await closeEntry(entryId, exitPrice, exitTime, supabase);
        return NextResponse.json(updatedEntry);
      }
      
      if (updates.action === 'cancel') {
        const updatedEntry = await cancelEntry(entryId, supabase);
        return NextResponse.json(updatedEntry);
      }
    }
    
    // 通常の更新処理
    // actionとexitPriceとexitTimeプロパティを削除
    const { action, exitPrice, exitTime, ...validUpdates } = updates;
    
    const updatedEntry = await updateEntry(entryId, validUpdates, supabase);
    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Error in PATCH /api/entries/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * エントリーを削除するDELETEハンドラ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    const entryId = params.id;
    
    // 現在のユーザーを取得（DIパターンでクライアントを渡す）
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // まずエントリーを取得して所有者チェック（DIパターンでクライアントを渡す）
    const entry = await getEntryById(entryId, supabase);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    
    if (entry.user_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // エントリーを削除（DIパターンでクライアントを渡す）
    await deleteEntry(entryId, supabase);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/entries/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 