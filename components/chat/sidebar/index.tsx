'use client'

// components/chat/sidebar/index.tsx
// チャットサイドバーコンポーネント
// 作成日: 2025/5/21
// 更新日: 2025/5/27 - 会話編集メニューを追加
// 更新日: 2025/5/28 - 型定義を@/types/network/supabaseからインポートするように変更

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  MessageSquare, 
  Loader2, 
  Search, 
  X, 
  MoreVertical,
  Settings,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import NewThreadModal from '@/components/chat/modals/NewThreadModal'
import EditConversationModal from '@/components/chat/modals/EditConversationModal'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tables } from '@/types/network/supabase'

// インポートした型定義を使用
type Conversation = Tables<'conversations'>

// TypeScriptのカスタムイベント型定義
type CustomEventWithDetail<T = any> = CustomEvent & {
  detail: T;
};

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isNewThreadModalOpen, setIsNewThreadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentEditConversation, setCurrentEditConversation] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // 現在のアクティブな会話IDを取得
  // パスが /chat/[id] 形式の場合と /?conversationId=[id] 形式の両方をサポート
  const pathId = pathname?.split('/').pop()
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const queryId = searchParams?.get('conversationId')
  const activeId = queryId || (pathId && pathId !== 'chat' ? pathId : null)

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
    
    // 会話作成イベントのリスナーを追加
    const handleConversationCreated = (event: CustomEvent<{conversationId: string}>) => {
      fetchConversations(); // 会話リストを更新
    };
    
    window.addEventListener('conversationCreated', handleConversationCreated as EventListener);
    
    return () => {
      window.removeEventListener('conversationCreated', handleConversationCreated as EventListener);
    };
  }, [])

  // 会話の並び替え（更新日時の新しい順）
  const sortedConversations = [...conversations].sort(
    (a, b) => {
      // nullチェックを追加
      const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return dateB - dateA;
    }
  )

  // 検索フィルター
  const filteredConversations = sortedConversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 新規会話作成モーダルを開く
  const openNewThreadModal = () => {
    setIsNewThreadModalOpen(true)
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
        detail: { conversationId: null as string | null } 
      }) as CustomEventWithDetail)
      
      // サイドバーを閉じる（モバイル対応）
      if (onClose) {
        onClose();
      }
    }
  }

  // 会話設定編集モーダルを開く
  const openEditModal = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation(); // 会話選択を防止
    setCurrentEditConversation(conversation);
    setIsEditModalOpen(true);
  }

  // 会話を削除する処理
  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 会話選択を防止
    
    if (!confirm('この会話を削除してもよろしいですか？この操作は元に戻せません。')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      // 会話一覧を更新
      setConversations(conversations.filter(c => c.id !== conversationId));
      
      // 削除した会話が現在アクティブな場合、別の会話に移動
      if (conversationId === activeId) {
        // 別の会話があれば選択、なければURLからIDを削除
        const nextConversation = sortedConversations.find(c => c.id !== conversationId);
        if (nextConversation) {
          selectConversation(nextConversation.id);
        } else {
          // URLからIDを削除
          const url = new URL(window.location.href);
          url.searchParams.delete('conversationId');
          window.history.pushState({}, '', url.toString());
          
          // 会話変更イベントを発行
          window.dispatchEvent(new CustomEvent('conversationChanged', { 
            detail: { conversationId: null as string | null } 
          }) as CustomEventWithDetail);
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('会話の削除に失敗しました');
    }
  }

  // 新規会話作成後のコールバック
  const onNewThreadCreated = (newThread: Conversation) => {
    setConversations([newThread, ...conversations])
    selectConversation(newThread.id)
    setIsNewThreadModalOpen(false)
  }

  // 会話設定更新後のコールバック
  const onConversationUpdated = (updatedConversation: Conversation) => {
    setConversations(conversations.map(conv => 
      conv.id === updatedConversation.id ? updatedConversation : conv
    ));
    setIsEditModalOpen(false);
  }

  // 時間を読みやすい形式に変換（例: 1時間前、3分前など）
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '時間不明';
    
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

  // サイドバーを閉じる（折りたたむ）処理
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#1e2130]">
      {/* ヘッダー */}
      <div className="relative flex h-14 items-center px-4 border-b border-gray-800">
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-gray-300" />
          <h2 className="font-medium text-gray-200">会話履歴</h2>
        </div>
        
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute right-3 p-1.5 rounded-full hover:bg-gray-700"
          aria-label="サイドバーを閉じる"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* 検索フォーム */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="会話を検索..."
            className="pl-9 bg-[#262a37] border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 新規会話ボタン */}
      <div className="px-3 mb-3">
        <Button
          onClick={openNewThreadModal}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しい会話
        </Button>
      </div>

      {/* 会話一覧 */}
      <div className="flex-1 overflow-auto px-2">
        {isLoading ? (
          <div className="flex h-20 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center text-center text-sm text-gray-400">
            <MessageSquare className="mb-2 h-10 w-10" />
            <p>会話がありません</p>
            <p className="mt-1">新しい会話を作成してください</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  'relative w-full p-3 text-left text-sm transition-colors rounded-lg group',
                  conversation.id === activeId
                    ? 'bg-[#383f55]'
                    : 'hover:bg-[#2a2f41]'
                )}
              >
                <button
                  onClick={() => selectConversation(conversation.id)}
                  className="w-full text-left"
                >
                  <div className="flex flex-col pr-7">
                    <div className="font-medium truncate text-gray-200">{conversation.title}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(conversation.updated_at)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      あなた: {'"ビットコインについて教えて"'}
                    </div>
                  </div>
                </button>
                
                {/* 編集メニュー */}
                <div className="absolute right-2 top-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="p-1 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#262a37] border-gray-700 text-gray-200">
                      <DropdownMenuItem 
                        className="cursor-pointer focus:bg-gray-700 focus:text-white"
                        onClick={(e) => openEditModal(conversation, e as React.MouseEvent)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        <span>設定を編集</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="cursor-pointer focus:bg-gray-700 focus:text-white text-red-400 focus:text-red-300"
                        onClick={(e) => handleDeleteConversation(conversation.id, e as React.MouseEvent)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>削除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新規スレッド作成モーダル */}
      <NewThreadModal
        isOpen={isNewThreadModalOpen}
        onClose={() => setIsNewThreadModalOpen(false)}
        onThreadCreated={onNewThreadCreated}
      />
      
      {/* 会話設定編集モーダル */}
      {currentEditConversation && (
        <EditConversationModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={onConversationUpdated}
          conversation={currentEditConversation}
        />
      )}
    </div>
  )
} 