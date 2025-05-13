'use client'

// components/Sidebar.tsx
// チャットサイドバーコンポーネント
// 作成日: 2025/5/20

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import NewThreadModal from './NewThreadModal'

type Conversation = {
  id: string
  title: string
  updated_at: string
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 現在のアクティブな会話IDを取得
  const activeId = pathname?.split('/').pop()

  // 会話一覧を取得
  const fetchConversations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      const data = await res.json()
      setConversations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // マウント時に会話一覧を取得
  useEffect(() => {
    fetchConversations()
  }, [])

  // 会話の並び替え（更新日時の新しい順）
  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  // 新規会話作成モーダルを開く
  const openNewThreadModal = () => {
    setIsModalOpen(true)
  }

  // 新規会話作成後のコールバック
  const onNewThreadCreated = (newThread: Conversation) => {
    setConversations([newThread, ...conversations])
    router.push(`/chat/${newThread.id}`)
    setIsModalOpen(false)
  }

  return (
    <div className="flex h-full w-full flex-col bg-muted/10">
      {/* ヘッダー */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="font-medium">会話履歴</h2>
        <Button variant="outline" size="icon" onClick={openNewThreadModal}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">新しい会話</span>
        </Button>
      </div>

      {/* 会話一覧 */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <MessageSquare className="mb-2 h-10 w-10" />
            <p>会話がありません</p>
            <p className="mt-1">新しい会話を作成してください</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => router.push(`/chat/${conversation.id}`)}
                className={cn(
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  conversation.id === activeId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
              >
                <div className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span className="line-clamp-1">{conversation.title}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 新規スレッド作成モーダル */}
      <NewThreadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onThreadCreated={onNewThreadCreated}
      />
    </div>
  )
} 