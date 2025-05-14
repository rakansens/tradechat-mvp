'use client'

// components/providers/SupabaseProvider.tsx
// Supabase認証プロバイダーコンポーネント
// 作成日: 2025/6/15

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { type Session, type User } from '@supabase/supabase-js'

// 認証コンテキストの型定義
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signUp: (email: string, password: string) => Promise<{
    error: Error | null
    data: { user: User | null; session: Session | null }
  }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

// デフォルト値の作成
const defaultContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  signIn: async () => ({ error: new Error('Not implemented'), data: { user: null, session: null } }),
  signUp: async () => ({ error: new Error('Not implemented'), data: { user: null, session: null } }),
  signOut: async () => ({ error: new Error('Not implemented') }),
  resetPassword: async () => ({ error: new Error('Not implemented') }),
  updatePassword: async () => ({ error: new Error('Not implemented') }),
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>(defaultContext)

// 認証プロバイダーコンポーネント
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Supabaseクライアントの作成
  const supabase = createClient()
  
  // 状態管理
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // セッション状態の監視
  useEffect(() => {
    const getSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      setIsLoading(false)
    }

    // 初回セッション取得
    getSession()

    // 認証状態変更リスナーの設定
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoading(false)
    })

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // サインイン関数
  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  // サインアップ関数
  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password })
  }

  // サインアウト関数
  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  // パスワードリセット要求関数
  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  // パスワード更新関数
  const updatePassword = async (newPassword: string) => {
    return await supabase.auth.updateUser({ password: newPassword })
  }

  // コンテキスト値
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// フックの作成
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseProvider')
  }
  return context
}