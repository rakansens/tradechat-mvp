/**
 * app/global-error.tsx
 * App Router用グローバルエラーページ（クライアントコンポーネント）
 * ルートレイアウトでエラーが発生した場合のフォールバック
 */

'use client'
 
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ja">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <h1 className="text-4xl font-bold mb-4">致命的なエラー</h1>
          <p className="text-xl mb-8">
            アプリケーション全体でエラーが発生しました。
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
      </body>
    </html>
  )
} 