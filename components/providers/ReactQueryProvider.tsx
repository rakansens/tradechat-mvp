'use client'

// components/providers/ReactQueryProvider.tsx
// React Queryプロバイダーコンポーネント
// 作成日: 2025/6/15
// 更新日: 2025/6/30 - Devtoolsを別コンポーネントに分離して安全に読み込む

import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Devtoolsを遅延ロード（クライアントサイドでのみ実行）
const ReactQueryDevtoolsProduction = dynamic(
  () => 
    import('@tanstack/react-query-devtools').then(d => ({
      default: d.ReactQueryDevtools,
    })),
  { ssr: false }
)

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
      </HydrationBoundary>
      
      {/* 開発環境でのみDevtoolsを表示 */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtoolsProduction />}
    </QueryClientProvider>
  )
} 