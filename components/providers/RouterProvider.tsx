'use client'

// components/providers/RouterProvider.tsx
// アプリ全体で使用するルーターをグローバルに設定するためのプロバイダー
// 作成日: 2025/6/29

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { setGlobalRouter } from '@/utils/fetcher'

interface RouterProviderProps {
  children: React.ReactNode
}

export function RouterProvider({ children }: RouterProviderProps) {
  const router = useRouter()
  
  // コンポーネントがマウントされたらグローバルルーターを設定
  useEffect(() => {
    setGlobalRouter(router)
    // クリーンアップは不要（アプリケーションのライフサイクル全体で利用）
  }, [router])
  
  // このコンポーネントはUIをレンダリングしない
  return <>{children}</>
}

export default RouterProvider 