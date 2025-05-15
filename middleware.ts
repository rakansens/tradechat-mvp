// middleware.ts
// Supabase認証のためのミドルウェア
// 作成日: 2025/6/15

import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middlewareClient'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ミドルウェアクライアントの作成
  const supabase = createMiddlewareClient(request, response)

  // セッションの取得
  const { data: { session } } = await supabase.auth.getSession()

  // 保護されたルートへのアクセスチェック
  const protectedRoutes = ['/settings']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // 認証関連ページへのアクセスチェック
  const authRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // 保護されたルートにアクセスしようとしていて、セッションがない場合はリダイレクト
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // 既にログインしているのに認証ページにアクセスしようとしている場合はホームページにリダイレクト
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
} 