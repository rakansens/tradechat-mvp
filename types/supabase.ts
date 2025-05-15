// types/supabase.ts
// Supabase型定義の統一ファイル
// 作成日: 2025/6/20

import { User } from '@supabase/supabase-js';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/network/supabase';

// 既存の型定義をエクスポート
export * from '@/types/network/supabase';

// プロフィール関連の拡張型定義
export type UserProfile = Tables<'profiles'> & {
  metadata?: {
    twitter_handle?: string;
    trading_experience?: string;
    [key: string]: any;
  };
};

// プロフィール操作関連の型定義
export type ProfileInsert = TablesInsert<'profiles'> & {
  metadata?: Record<string, any>;
};

export type ProfileUpdate = TablesUpdate<'profiles'> & {
  metadata?: Record<string, any>;
};

// 認証ユーザーの拡張型
export type AuthUser = User & {
  profile?: UserProfile;
};

// 設定関連の拡張型
export type UserSettings = {
  theme?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  trading?: {
    default_pair?: string;
    risk_level?: 'low' | 'medium' | 'high';
  };
  [key: string]: any;
};

// 型ガード関数
export const isUserProfile = (obj: any): obj is UserProfile => {
  return obj && typeof obj === 'object' && 'user_id' in obj;
};

export const isAuthUser = (obj: any): obj is AuthUser => {
  return obj && typeof obj === 'object' && 'id' in obj && 'aud' in obj;
}; 