'use client';

/**
 * 認証管理用のカスタムフック
 * 作成日: 2025/6/15 
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';
import { getProfile, updateProfile } from '@/lib/supabase/supabase-auth';
import { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  // セッション状態の初期化と監視
  useEffect(() => {
    setIsLoading(true);

    // 現在のセッションを取得
    const getCurrentSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('セッション取得エラー:', error);
        return;
      }
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      
      setIsLoading(false);
    };
    
    getCurrentSession();

    // セッション変更を購読
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ユーザープロフィールの取得
  const fetchUserProfile = async (userId: string) => {
    try {
      const userProfile = await getProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };

  // サインアップ
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('サインアップエラー:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  // サインイン
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      router.push('/dashboard');
      return { data, error: null };
    } catch (error) {
      console.error('サインインエラー:', error);
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push('/');
    } catch (error) {
      console.error('サインアウトエラー:', error);
    }
  };

  // パスワードリセットメール送信
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return { error };
    }
  };

  // プロフィール更新
  const updateUserProfile = async (profileData: any) => {
    if (!user) return { error: new Error('ユーザーが認証されていません') };
    
    try {
      const result = await updateProfile(user.id, profileData);
      await fetchUserProfile(user.id);
      return { data: result, error: null };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return { data: null, error };
    }
  };

  return {
    user,
    session,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserProfile,
  };
} 