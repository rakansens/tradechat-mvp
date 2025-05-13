/**
 * app/error.tsx
 * App Router用エラーページ（クライアントコンポーネント）
 */

'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">エラーが発生しました</h1>
      <p className="text-xl mb-8">
        申し訳ありませんが、予期しないエラーが発生しました。
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        再試行
      </button>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 mt-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
      >
        ホームに戻る
      </button>
    </div>
  )
} 