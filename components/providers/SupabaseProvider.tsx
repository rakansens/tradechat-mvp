'use client'

/**
 * SupabaseProvider
 * アプリケーション全体で使用するSupabase認証状態の管理
 * 作成日: 2025/6/15
 * 更新日: 2025/6/23 - named exportに変更
 * 更新日: 2025/6/25 - signInとsignUp関数を追加
 * 更新日: 2025/8/27 - getSession()からgetUser()に移行し、セキュリティ警告を解消
 * 更新日: 2025/9/30 - resetPassword関数を追加（テスト対応）
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { env } from '@/config/environment'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { AuthUser } from '@/types/supabase'
import { signInWithPassword, signUp as supabaseSignUp, resetPassword as supabaseResetPassword } from '@/lib/supabase/features/auth'

// 認証コンテキストの型定義
interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  resetPassword: (email: string) => Promise<any>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  resetPassword: async () => ({}),
  signOut: async () => {},
  refreshSession: async () => {},
})

// 認証コンテキストを使用するためのカスタムフック
export const useAuth = () => {
  return useContext(AuthContext)
}

// Supabaseプロバイダーコンポーネント
export function SupabaseProvider({
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

  // ログイン処理
  const signIn = async (email: string, password: string) => {
    try {
      // 環境変数チェック
      if (!env.supabase.url || !env.supabase.anonKey) {
        console.error('環境変数エラー: Supabase設定が不足しています', {
          url: env.supabase.url ? '設定済み' : '未設定',
          key: env.supabase.anonKey ? '設定済み' : '未設定'
        });
        return { data: null, error: new Error('認証システムの設定エラー。管理者に連絡してください。') };
      }

      console.log('Supabase認証開始:', { email });
      const data = await signInWithPassword(email, password);
      console.log('Supabase認証成功:', { session: !!data?.session });
      await refreshSession();
      return { data, error: null };
    } catch (error) {
      console.error('ログインエラー (SupabaseProvider):', error);
      return { data: null, error };
    }
  }

  // サインアップ処理
  const signUp = async (email: string, password: string) => {
    try {
      const data = await supabaseSignUp(email, password);
      return { data, error: null };
    } catch (error) {
      console.error('サインアップエラー:', error);
      return { data: null, error };
    }
  }

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

  // パスワードリセットメール送信
  const resetPassword = async (email: string) => {
    try {
      await supabaseResetPassword(email);
      return { error: null };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return { error };
    }
  };

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
          // getUser()を使用してユーザー情報を取得（セキュリティ向上）
          const { data } = await supabase.auth.getUser()
          setUser(data.user as AuthUser)
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
    signIn,
    signUp,
    resetPassword,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 後方互換性のためのデフォルトエクスポート
export default SupabaseProvider;