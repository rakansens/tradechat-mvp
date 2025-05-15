// app/api/auth/callback/route.ts
// Supabase認証コールバック処理
// 作成日: 2025/6/15
// 更新日: 2025/9/17 - createRouteHandlerClient呼び出しを非同期に修正

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const supabase = await createRouteHandlerClient()

    // コードを交換してセッションを確立
    await supabase.auth.exchangeCodeForSession(code)
  }

  // ユーザーをリダイレクト
  return NextResponse.redirect(requestUrl.origin)
} 