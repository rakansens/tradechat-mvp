import "@/app/globals.css"
import { Inter } from "next/font/google"
import ClientLayout from "@/components/ClientLayout"
import type { Metadata } from "next"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastListener } from "@/components/common/toast"
import { SocketProvider } from '@/components/providers/socket-provider'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider'
import { ModalProvider } from '@/components/providers/ModalProvider'

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "TradeChatAI",
  description: "AIトレーディングアシスタント",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="dark" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SocketProvider>
            <SupabaseProvider>
              <ReactQueryProvider>
                <ModalProvider>
                  <Toaster />
                  <ClientLayout>{children}</ClientLayout>
                  <ToastListener />
                </ModalProvider>
              </ReactQueryProvider>
            </SupabaseProvider>
          </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
