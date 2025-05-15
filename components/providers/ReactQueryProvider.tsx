'use client'

// components/providers/ReactQueryProvider.tsx
// React Queryプロバイダーコンポーネント
// 作成日: 2025/6/15
// 更新日: 2025/6/28 - 設定の最適化およびDevToolsを開発環境のみに制限

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

// 開発環境でのみDevtoolsをロード
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? require('@tanstack/react-query-devtools').ReactQueryDevtools
  : () => null

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5000, // データが古くなるまでの時間（5秒）
        retry: 1,        // リトライ回数を1回に制限
      },
    },
  }))
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 