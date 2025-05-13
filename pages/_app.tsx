/**
 * pages/_app.tsx
 * Nextjsの静的エクスポート用にカスタムAppコンポーネントを提供
 * App Router使用時でも必要になることがある
 */

import type { AppProps } from 'next/app'
import '@/app/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
} 