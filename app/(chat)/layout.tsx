'use client'

// app/(chat)/layout.tsx
// チャット用のレイアウトコンポーネント
// 作成日: 2025/5/20

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // ハイドレーション後にクライアントサイドのみのコンポーネントを表示
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // ルートパスの場合、会話一覧を取得して最初の会話にリダイレクト
  useEffect(() => {
    if (pathname === '/chat' && isMounted) {
      fetch('/api/conversations')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            router.push(`/chat/${data[0].id}`)
          }
        })
        .catch(error => {
          console.error('Failed to fetch conversations:', error)
        })
    }
  }, [pathname, router, isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* モバイル用サイドバートリガー */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">サイドバーを開く</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* デスクトップ用サイドバー */}
      <div className="hidden md:flex h-full w-[250px] border-r">
        <Sidebar />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
} 