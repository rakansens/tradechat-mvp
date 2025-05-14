// utils/supabase/server.ts
// Supabase SSR - サーバーコンポーネント用ユーティリティ
// 作成日: 2025/6/15

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/network/supabase'
import { cache } from 'react'

export const createClient = cache(() => {
  const cookieStore = cookies()
  
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