// app/api/social/following/route.ts
// フォロー一覧の取得と管理のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/23 - SSRクライアント対応でインポート更新と関数シグネチャ修正

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase/features/auth';
import {
  getUserFollowing,
  followUser,
  unfollowUser,
  searchUsers // ユーザー検索用
} from '@/lib/supabase/features/relations';

/**
 * フォロー一覧を取得するGETハンドラ
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const getCount = searchParams.get('count') === 'true';
    const checkUserId = searchParams.get('checkUserId');
    
    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // フォロー一覧を取得
    const following = await getUserFollowing(user.id);

    // 特定のユーザーをフォローしているか確認
    if (checkUserId) {
      // 現在のフォロー一覧に対象ユーザーが含まれているか確認
      const isFollowing = following.some(follow => follow.id === checkUserId);
      return NextResponse.json({ following: isFollowing });
    }

    // 件数だけ取得する場合
    if (getCount) {
      // 新しいAPIでは専用のカウント関数がないため、結果の長さを返す
      return NextResponse.json({ count: following.length });
    }

    // 追加された結果からリクエストされた範囲のみを返す
    // 注意: APIがページング機能を持たないため、フロントエンドでページングする
    const paginatedFollowing = following.slice(offset, offset + limit);

    return NextResponse.json(paginatedFollowing);
  } catch (error) {
    console.error('Error in GET /api/social/following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ユーザーをフォローするPOSTハンドラ
 */
export async function POST(request: Request) {
  try {
    // リクエストボディからフォロー対象のユーザーIDを取得
    const { userId } = await request.json();

    // バリデーション
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 自分自身をフォローしようとしていないか確認
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // ユーザーをフォロー
    const result = await followUser(user.id, userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in POST /api/social/following:', error);
    // 既にフォローしている場合など、特定のエラー処理
    if (error instanceof Error && error.message === '既にフォローしています') {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * フォローを解除するDELETEハンドラ
 */
export async function DELETE(request: Request) {
  try {
    // URL からパラメータを取得
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'UserId parameter is required' },
        { status: 400 }
      );
    }

    // 現在のユーザーを取得
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // フォローを解除
    await unfollowUser(user.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/social/following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 