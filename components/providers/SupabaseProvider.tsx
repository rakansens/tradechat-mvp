'use client'

/**
 * SupabaseProvider
 * アプリケーション全体で使用するSupabase認証状態の管理
 * 作成日: 2025/6/15
 * 更新日: 2025/6/20 - 型定義を更新
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { AuthUser } from '@/types/supabase'

// 認証コンテキストの型定義
interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshSession: async () => {},
})

// 認証コンテキストを使用するためのカスタムフック
export const useAuth = () => {
  return useContext(AuthContext)
}

// Supabaseプロバイダーコンポーネント
export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Supabaseクライアントの初期化
  const supabase = createClient()
  const router = useRouter()
  
  // 状態管理
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // 認証済みか判定するgetter
  const isAuthenticated = !!session && !!user;

  // セッションを更新する関数
  const refreshSession = async () => {
    try {
      const { data: { session: newSession } } = await supabase.auth.getSession()
      if (newSession) {
        setSession(newSession)
        const { data: { user: newUser } } = await supabase.auth.getUser()
        setUser(newUser as AuthUser)
      }
    } catch (error) {
      console.error('セッション更新エラー:', error)
    }
  }

  // サインアウト処理
  const signOut = async () => {
    try {
      // サーバーサイドAPIを使用してサインアウト
      await fetch('/auth/signout', { method: 'POST' })
      
      // ローカル状態もクリア
      setUser(null)
      setSession(null)
      
      // ホームページにリダイレクト
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('サインアウトエラー:', error)
    }
  }

  // 初期化時にセッションを取得
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true)
      
      try {
        // 現在のセッションを取得
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        setSession(currentSession)
        
        if (currentSession) {
          // ユーザー情報を取得
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          setUser(currentUser as AuthUser)
        }
      } catch (error) {
        console.error('認証初期化エラー:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    initializeAuth()
    
    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession)
        
        if (newSession) {
          const { data: { user: newUser } } = await supabase.auth.getUser()
          setUser(newUser as AuthUser)
        } else {
          setUser(null)
        }
        
        // URLの状態を更新（これによりミドルウェアが再実行される）
        router.refresh()
      }
    )
    
    // クリーンアップ関数
    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // 認証コンテキストの値
  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}