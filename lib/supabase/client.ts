// lib/supabase/client.ts
// Supabase SSR - クライアントコンポーネント用ユーティリティ
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - libディレクトリに移動

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/network/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 