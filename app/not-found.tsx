/**
 * app/not-found.tsx
 * App Router用404ページ
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">404 - ページが見つかりません</h1>
      <p className="text-xl mb-8">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link 
        href="/"
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        ホームに戻る
      </Link>
    </div>
  )
} 