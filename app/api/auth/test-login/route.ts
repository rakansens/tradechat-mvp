// app/api/auth/test-login/route.ts
// ログインテスト用のAPIエンドポイント（デバッグ用）
// 作成日: 2025/8/28 - クライアント側でのAPIキー参照をなくすために新規作成

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient';

export async function POST(request: NextRequest) {
  try {
    // 開発環境でのみ動作するように制限
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'このエンドポイントは開発環境でのみ利用可能です' }, 
        { status: 403 }
      );
    }

    // リクエストボディを取得
    const { email, password } = await request.json();
    
    // 入力チェック
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' }, 
        { status: 400 }
      );
    }
    
    // SSR対応Supabaseクライアントを生成
    const supabase = await createRouteHandlerClient();
    
    // ログイン試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    // エラーが発生した場合はエラー内容を返す
    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          status: error.status
        }, 
        { status: 400 }
      );
    }
    
    // 成功時はユーザー情報を返す（機密情報は除外）
    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        lastSignIn: data.user?.last_sign_in_at,
        createdAt: data.user?.created_at
      },
      session: {
        expiresAt: data.session?.expires_at
      }
    });
  } catch (error: any) {
    console.error('ログインテストエラー:', error);
    return NextResponse.json(
      { error: `テスト実行中にエラーが発生しました: ${error.message}` }, 
      { status: 500 }
    );
  }
} 