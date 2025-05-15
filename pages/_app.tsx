// pages/_app.tsx
// 作成日: 2025/6/29 - React QueryとRouterをpages Routerに対応させる

import type { AppProps } from 'next/app'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { RouterProvider } from '@/components/providers/RouterProvider'

/**
 * Pages Router用のAppコンポーネント
 * App Routerとの共存環境でReact Query対応するために作成
 */
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ReactQueryProvider>
      <RouterProvider>
        <Component {...pageProps} />
      </RouterProvider>
    </ReactQueryProvider>
  )
} 