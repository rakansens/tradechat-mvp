// lib/supabase/routeHandlerClient.ts
// Supabase SSR - ルートハンドラー用ユーティリティ
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - libディレクトリに移動
// 更新日: 2025/6/20 - リンターエラー修正

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/network/supabase'
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies'

export function createRouteHandlerClient() {
  // cookies()が実際にはPromiseではなく、オブジェクトを返すことを型アサーションで伝える
  const cookieStore = cookies() as unknown as RequestCookies
  
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