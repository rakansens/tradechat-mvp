// lib/supabase/routeHandlerClient.ts
// Supabase SSR - ルートハンドラー用ユーティリティ
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - libディレクトリに移動
// 更新日: 2025/6/20 - リンターエラー修正
// 更新日: 2025/8/22 - Next.js 15対応: cookies()をawaitするように変更

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/network/supabase'
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies'

export async function createRouteHandlerClient() {
  // Next.js 15ではcookies()が非同期になったため、awaitする
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
} 