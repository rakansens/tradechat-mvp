// app/api/profile/route.ts
// ユーザープロフィール取得と更新のためのAPIエンドポイント
// 作成日: 2025/5/14
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）
// 更新日: 2025/9/17 - createRouteHandlerClientを使用するよう修正

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getProfile, updateProfile } from '@/lib/supabase/features/auth';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';
import { Database } from '@/types/network/supabase';

/**
 * 現在のユーザープロフィールを取得するGETハンドラ
 */
export async function GET() {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザープロフィールを取得
    const profile = await getProfile(user.id, supabase);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in GET /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ユーザープロフィールを更新するPUTハンドラ
 */
export async function PUT(request: Request) {
  try {
    // RouteHandler用のSupabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // リクエストボディを取得
    const { display_name, avatar_url, bio } = await request.json();

    // 現在のユーザーを取得
    const user = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // プロフィールを更新
    const updatedProfile = await updateProfile(user.id, {
      display_name,
      avatar_url,
      bio,
    }, supabase);

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error in PUT /api/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 