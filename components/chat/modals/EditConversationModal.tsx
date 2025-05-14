'use client'

// components/chat/modals/EditConversationModal.tsx
// 会話設定編集モーダル
// 作成日: 2025/5/27 - システムプロンプト編集機能を実装
// 更新日: 2025/5/28 - 型定義を@/types/network/supabaseからインポートするように変更

import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { Tables } from '@/types/network/supabase'

interface EditConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedConversation: Tables<'conversations'>) => void
  conversation: Tables<'conversations'>
}

export default function EditConversationModal({
  isOpen,
  onClose,
  onSave,
  conversation,
}: EditConversationModalProps) {
  const [title, setTitle] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 会話データをフォームにセット
  useEffect(() => {
    if (isOpen && conversation) {
      setTitle(conversation.title || '')
      setSystemPrompt(conversation.system_prompt || '')
      
      // タイトル入力欄にフォーカス
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, conversation])

  // モーダルが閉じるときにフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setIsSaving(false)
    }
  }, [isOpen])

  // 会話設定の保存処理
  const handleSaveSettings = async () => {
    // バリデーション
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          system_prompt: systemPrompt.trim() || null 
        }),
      })

      if (!res.ok) {
        throw new Error('会話の更新に失敗しました')
      }

      const updatedConversation = await res.json()
      onSave(updatedConversation)
    } catch (error) {
      console.error('Error updating conversation:', error)
      setError(error instanceof Error ? error.message : '会話の更新に失敗しました')
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#1e2130] border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>会話設定の編集</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              会話タイトル
            </label>
            <Input
              id="title"
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: Bitcoin価格分析"
              className="col-span-3 bg-[#262a37] border-gray-700"
            />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="systemPrompt" className="text-sm font-medium">
              システムプロンプト (任意)
            </label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="AIの振る舞いを設定するシステムプロンプトを入力（例：あなたはビットコイン分析の専門家です）"
              className="col-span-3 min-h-[100px] bg-[#262a37] border-gray-700"
            />
            <p className="text-xs text-gray-400">
              システムプロンプトは会話全体のAIの振る舞いを決定します。AIの役割や専門知識、返答スタイルなどを指定できます。
            </p>
          </div>
          
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSaving}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSaveSettings} 
            disabled={isSaving || !title.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 