'use client'

// components/providers/ReactQueryProvider.tsx
// React Queryプロバイダーコンポーネント
// 作成日: 2025/6/15
// 更新日: 2025/6/29 - DevToolsの安全なロードとHydrationサポート

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query'
import { useState } from 'react'

// 開発環境でのみDevtoolsをロード - try-catchでラップして安全に
let ReactQueryDevtools = () => null
if (process.env.NODE_ENV === 'development') {
  try {
    // 開発環境でのみDynamic importを使用
    ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools
  } catch (e) {
    console.warn('React Query DevTools could not be loaded', e)
    ReactQueryDevtools = () => null
  }
}

// デフォルトのQueryClientインスタンスを作成（サーバーコンポーネントでprefetchに使用）
export const getQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // データが古くなるまでの時間（5秒）
      retry: 1,        // リトライ回数を1回に制限
    },
  },
})

interface ReactQueryProviderProps {
  children: React.ReactNode;
  dehydratedState?: unknown;
}

export function ReactQueryProvider({ 
  children,
  dehydratedState
}: ReactQueryProviderProps) {
  const [queryClient] = useState(() => getQueryClient())
  
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </HydrationBoundary>
    </QueryClientProvider>
  )
} 