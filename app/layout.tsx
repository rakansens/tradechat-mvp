import "@/app/globals.css"
import { Inter } from "next/font/google"
import ClientLayout from "@/components/ClientLayout"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TradeChat MVP",
  description: "チャットベースで自然言語によりチャート分析・エントリー提案・モック注文実行ができる最小限のUIモック",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
