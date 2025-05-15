// app/api/social/followers/route.ts
// フォロワーの取得と管理のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/23 - SSRクライアント対応でインポート更新と関数シグネチャ修正

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import {
  getUserFollowers,
  unfollowUser
} from '@/lib/supabase/features/relations';

/**
 * フォロワー一覧を取得するGETハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getCount = searchParams.get('count') === 'true';
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // フォロワー一覧を取得
    const followers = await getUserFollowers(user.id);

    // 件数だけ取得する場合
    if (getCount) {
      // 新しいAPIでは専用のカウント関数がないため、結果の長さを返す
      return NextResponse.json({ count: followers.length });
    }

    // 追加された結果からリクエストされた範囲のみを返す
    // 注意: APIがページング機能を持たないため、フロントエンドでページングする
    const paginatedFollowers = followers.slice(offset, offset + limit);

    return NextResponse.json(paginatedFollowers);
  } catch (error) {
    console.error('Error in GET /api/social/followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フォロワーを削除する（ブロックする）DELETEハンドラ
 * 特定のユーザーが自分をフォローしないようにブロックする
 */
export async function DELETE(request: Request) {
  try {
    // URL からパラメータを取得
    const url = new URL(request.url);
    const followerId = url.searchParams.get('followerId');
    
    if (!followerId) {
      return NextResponse.json(
        { error: 'FollowerId parameter is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // フォロワーを削除（このユーザーからあなたへのフォローを解除）
    await unfollowUser(followerId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/social/followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 