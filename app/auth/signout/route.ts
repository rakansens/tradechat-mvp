// app/auth/signout/route.ts
// サインアウト処理のルートハンドラー
// 作成日: 2025/6/15
// 更新日: 2025/8/28 - URL未定義時のフォールバック改善

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    
    // サインアウト処理を実行
    await supabase.auth.signOut()
    
    // URL未定義時のフォールバックを強化
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? request.headers.get('origin') ?? 'http://localhost:3000';
    
    return NextResponse.redirect(new URL('/', base), {
      status: 302,
    })
  } catch (error) {
    console.error('サインアウトエラー:', error);
    
    // エラー発生時も安全にリダイレクト
    const fallbackBase = request.headers.get('origin') ?? 'http://localhost:3000';
    return NextResponse.redirect(new URL('/', fallbackBase), {
      status: 302,
    })
  }
} 