// lib/supabase-auth.ts
// Supabase認証関連ユーティリティ関数
// 作成日: 2025/5/7

import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';

/**
 * ユーザーサインアップ
 * @param email メールアドレス
 * @param password パスワード
 * @returns サインアップ結果
 */
export const signUp = async (email: string, password: string) => {
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
) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
        bio,
      },
    ])
    .select();
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * ユーザープロフィールを取得
 * @param userId ユーザーID
 * @returns ユーザープロフィール
 */
export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
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
  updates: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
  }
) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select();
  
  if (error) {
    throw error;
  }
  
  return data;
};

/**
 * 認証状態の変更を監視
 * @param callback コールバック関数
 * @returns 購読解除関数
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};