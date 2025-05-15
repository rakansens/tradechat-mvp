// lib/supabase/features/auth.ts
// Supabase認証関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/5/7 - 初期実装
// 更新日: 2025/5/14 - 型参照とプロフィール操作メソッドを最新の型定義に更新
// 更新日: 2025/6/20 - SSRクライアント対応

import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';

// プロフィール操作関連の型定義
type Profile = Tables<'profiles'>;
type ProfileInsert = TablesInsert<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

/**
 * ユーザーサインアップ
 * @param email メールアドレス
 * @param password パスワード
 * @returns サインアップ結果
 */
export const signUp = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * メールアドレスとパスワードでサインイン
 * @param email メールアドレス
 * @param password パスワード
 * @returns サインイン結果
 */
export const signInWithPassword = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * サインアウト
 * @returns サインアウト結果
 */
export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
  
  return true;
};

/**
 * 現在のセッションを取得
 * @returns 現在のセッション
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    throw error;
  }
  
  return data.session;
};

/**
 * 現在のユーザーを取得
 * @returns 現在のユーザー
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    throw error;
  }
  
  return data.user;
};

/**
 * パスワードリセットメールを送信
 * @param email メールアドレス
 * @returns 送信結果
 */
export const resetPassword = async (email: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * パスワード更新
 * @param password 新しいパスワード
 * @returns 更新結果
 */
export const updatePassword = async (password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * ユーザープロフィールを作成
 * @param userId ユーザーID
 * @param displayName 表示名
 * @param avatarUrl アバターURL
 * @param bio 自己紹介
 * @returns 作成結果
 */
export const createProfile = async (
  userId: string,
  displayName?: string,
  avatarUrl?: string,
  bio?: string
): Promise<Profile | null> => {
  const supabase = createClient();
  const profileData: ProfileInsert = {
    user_id: userId,
    display_name: displayName || null,
    avatar_url: avatarUrl || null,
    bio: bio || null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select();
  
  if (error) {
    throw error;
  }
  
  return data?.[0] || null;
};

/**
 * ユーザープロフィールを取得
 * @param userId ユーザーID
 * @returns ユーザープロフィール
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    // レコードが見つからない場合はnullを返す（エラーをスローしない）
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return data;
};

/**
 * ユーザープロフィールを更新
 * @param userId ユーザーID
 * @param updates 更新内容
 * @returns 更新結果
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<Profile | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select();
  
  if (error) {
    throw error;
  }
  
  return data?.[0] || null;
};

/**
 * 認証状態の変更を監視
 * @param callback コールバック関数
 * @returns 購読解除関数
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  const supabase = createClient();
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}; 