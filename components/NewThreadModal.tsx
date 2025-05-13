'use client'

// components/NewThreadModal.tsx
// 新規会話作成モーダル
// 作成日: 2025/5/20

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
import { Loader2 } from 'lucide-react'

interface NewThreadModalProps {
  isOpen: boolean
  onClose: () => void
  onThreadCreated: (newThread: any) => void
}

export default function NewThreadModal({
  isOpen,
  onClose,
  onThreadCreated,
}: NewThreadModalProps) {
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // モーダルが開いたときにタイトル入力欄にフォーカス
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // モーダルが閉じるときにフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setError(null)
      setIsCreating(false)
    }
  }, [isOpen])

  // 新規会話作成処理
  const handleCreateThread = async () => {
    // バリデーション
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!res.ok) {
        throw new Error('会話の作成に失敗しました')
      }

      const newThread = await res.json()
      onThreadCreated(newThread)
    } catch (error) {
      console.error('Error creating thread:', error)
      setError(error instanceof Error ? error.message : '会話の作成に失敗しました')
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新しい会話を作成</DialogTitle>
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
              className="col-span-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  e.preventDefault()
                  handleCreateThread()
                }
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            キャンセル
          </Button>
          <Button onClick={handleCreateThread} disabled={isCreating || !title.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                作成中...
              </>
            ) : (
              '作成'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 