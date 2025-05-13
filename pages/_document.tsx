/**
 * pages/_document.tsx
 * Nextjsの静的エクスポート用にカスタムドキュメントを提供
 * App Router使用時でも必要になることがある
 */

import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ja">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 