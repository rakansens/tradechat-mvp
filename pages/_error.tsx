/**
 * pages/_error.tsx
 * カスタムエラーページ
 */

import { NextPage } from 'next'

interface ErrorProps {
  statusCode?: number
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-4xl font-bold mb-4">
        {statusCode
          ? `エラー: ${statusCode}`
          : 'クライアントエラーが発生しました'}
      </h1>
      <p className="text-xl mb-8">
        {statusCode
          ? `サーバーでエラーが発生しました`
          : 'クライアント側でエラーが発生しました'}
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        ホームに戻る
      </button>
    </div>
  )
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error