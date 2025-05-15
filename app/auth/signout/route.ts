// app/auth/signout/route.ts
// サインアウト処理のルートハンドラー
// 作成日: 2025/6/15

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/routeHandlerClient'

export async function POST() {
  const supabase = createRouteHandlerClient()
  
  // サインアウト処理を実行
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), {
    status: 302,
  })
} 