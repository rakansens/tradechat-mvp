'use client'

// app/components/auth/LogoutButton.tsx
// サーバーアクション経由でログアウトを実行するボタンコンポーネント
// 作成日: 2025/6/15

import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.redirected) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('サインアウトエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? 'ログアウト中...' : 'ログアウト'}
    </Button>
  )
} 