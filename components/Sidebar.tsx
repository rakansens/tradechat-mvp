'use client'

// components/Sidebar.tsx
// チャットサイドバーコンポーネント
// 作成日: 2025/5/20
// 更新日: 2025/5/21 - UIUXを既存デザインに合わせて更新
// 更新日: 2025/6/5 - 設定モーダル機能を追加

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, MessageSquare, Loader2, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import NewThreadModal from './NewThreadModal'
import { Input } from '@/components/ui/input'
import { SettingsModal } from './ui/SettingsModal'
import { useAuth } from '@/hooks/auth/useAuth'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)

  // 現在のアクティブな会話IDを取得
  // パスが /chat/[id] 形式の場合と /?conversationId=[id] 形式の両方をサポート
  const pathId = pathname?.split('/').pop()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const queryId = searchParams?.get('conversationId')
  const activeId = queryId || (pathId && pathId !== 'chat' ? pathId : null)

  // ユーザー情報の取得
  const { user } = useAuth();
  
  // ユーザーIDを設定
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

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

  // 検索フィルター
  const filteredConversations = sortedConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 新規会話作成モーダルを開く
  const openNewThreadModal = () => {
    setIsModalOpen(true)
  }

  // 会話を選択する処理
  const selectConversation = (conversationId: string) => {
    // メインUIとApp Router UIの両方に対応
    if (pathname?.startsWith('/chat')) {
      // App Router UI
      router.push(`/chat/${conversationId}`)
    } else {
      // メインUI - URLパラメータを使用
      const url = new URL(window.location.href)
      url.searchParams.set('conversationId', conversationId)
      window.history.pushState({}, '', url.toString())
      
      // イベントを発行して会話の切り替えを通知
      window.dispatchEvent(new CustomEvent('conversationChanged', { 
        detail: { conversationId } 
      }))
    }
  }

  // 新規会話作成後のコールバック
  const onNewThreadCreated = (newThread: Conversation) => {
    setConversations([newThread, ...conversations])
    selectConversation(newThread.id)
    setIsModalOpen(false)
  }

  // 時間を読みやすい形式に変換（例: 1時間前、3分前など）
  const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}日前`;
    if (hours > 0) return `${hours}時間前`;
    if (minutes > 0) return `${minutes}分前`;
    return '数秒前';
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#1e2130]">
      {/* ヘッダー */}
      <div className="flex h-14 items-center p-4 justify-between border-b border-gray-800">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          <h2 className="font-medium">会話履歴</h2>
        </div>
        
        {/* 設定ボタン */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSettingsOpen(true)}
          className="h-8 w-8 rounded-full hover:bg-gray-800"
          title="設定"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* 検索フォーム */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="会話を検索..."
            className="pl-9 bg-[#262a37] border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 新規会話ボタン */}
      <div className="px-3 mb-3">
        <Button
          onClick={openNewThreadModal}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しい会話
        </Button>
      </div>

      {/* 会話一覧 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <MessageSquare className="mb-2 h-10 w-10" />
            <p>会話がありません</p>
            <p className="mt-1">新しい会話を作成してください</p>
          </div>
        ) : (
          <div className="space-y-1 px-1">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => selectConversation(conversation.id)}
                className={cn(
                  'w-full p-3 text-left text-sm transition-colors rounded-lg',
                  conversation.id === activeId
                    ? 'bg-[#383f55]'
                    : 'hover:bg-[#2a2f41]'
                )}
              >
                <div className="flex flex-col">
                  <div className="font-medium truncate">{conversation.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatRelativeTime(conversation.updated_at)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    あなた: {'"ビットコインについて教えて"'}
                  </div>
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

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
} 