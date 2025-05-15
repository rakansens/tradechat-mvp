// lib/supabase/server.ts
// Supabase SSR - サーバーコンポーネント用ユーティリティ
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - libディレクトリに移動
// 更新日: 2025/6/20 - リンターエラー修正
// 更新日: 2025/8/22 - Next.js 15対応: cookies()をawaitするように変更

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/network/supabase'
import { cache } from 'react'
import { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies'

export const createClient = cache(async () => {
  // Next.js 15ではcookies()が非同期になったため、awaitする
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // サーバーコンポーネントからはクッキーを設定できない場合がある
            console.error('Cookie設定エラー:', error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.error('Cookie削除エラー:', error)
          }
        },
      },
    }
  )
}) 