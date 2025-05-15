// lib/supabase/features/profile.ts
// Supabaseプロフィール拡張ユーティリティ（SSR対応版）
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - SSRクライアント対応
// 更新日: 2025/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())

import { createClient } from '@/lib/supabase/client';
import { UserProfile, ProfileInsert, ProfileUpdate } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * ユーザープロフィールを取得（メタデータ対応）
 * @param userId ユーザーID
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 拡張ユーザープロフィール
 */
export const getExtendedProfile = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<UserProfile | null> => {
  const supabase = supabaseClient ?? createClient();
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
  
  // データベースから取得したプロフィールをUserProfile型に変換
  return data as UserProfile;
};

/**
 * ユーザープロフィールを作成（メタデータ対応）
 * @param userId ユーザーID
 * @param profile プロフィールデータ
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 作成された拡張ユーザープロフィール
 */
export const createExtendedProfile = async (
  userId: string,
  profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    metadata?: Record<string, any>;
  },
  supabaseClient?: SupabaseClient
): Promise<UserProfile> => {
  const supabase = supabaseClient ?? createClient();
  // プロフィールデータの準備
  const profileData: ProfileInsert = {
    user_id: userId,
    display_name: profile.display_name || null,
    avatar_url: profile.avatar_url || null,
    bio: profile.bio || null,
    metadata: profile.metadata || undefined
  };

  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as UserProfile;
};

/**
 * メタデータを含むプロフィール更新
 * @param userId ユーザーID
 * @param profile 更新するプロフィールデータ
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 更新された拡張ユーザープロフィール
 */
export const updateExtendedProfile = async (
  userId: string,
  profile: {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    metadata?: Record<string, any>;
  },
  supabaseClient?: SupabaseClient
): Promise<UserProfile> => {
  // 現在のプロフィールを取得
  const currentProfile = await getExtendedProfile(userId, supabaseClient);
  
  // 新しいメタデータの準備
  // 現在のメタデータと新しいメタデータをマージ
  const mergedMetadata = {
    ...((currentProfile?.metadata || {}) as Record<string, any>),
    ...(profile.metadata || {})
  };
  
  // 更新データの準備
  const updates: ProfileUpdate = {
    display_name: profile.display_name ?? currentProfile?.display_name ?? null,
    avatar_url: profile.avatar_url ?? currentProfile?.avatar_url ?? null,
    bio: profile.bio ?? currentProfile?.bio ?? null,
    metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined
  };
  
  // プロフィールが存在しない場合は作成、存在する場合は更新
  if (!currentProfile) {
    return await createExtendedProfile(userId, {
      display_name: updates.display_name || undefined,
      avatar_url: updates.avatar_url || undefined,
      bio: updates.bio || undefined,
      metadata: updates.metadata as Record<string, any> || undefined
    }, supabaseClient);
  }
  
  const supabase = supabaseClient ?? createClient();
  // プロフィールの更新
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as UserProfile;
};

/**
 * プロフィールメタデータの特定フィールドを更新
 * @param userId ユーザーID
 * @param key メタデータのキー
 * @param value メタデータの値
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 更新された拡張ユーザープロフィール
 */
export const updateProfileMetadata = async (
  userId: string,
  key: string,
  value: any,
  supabaseClient?: SupabaseClient
): Promise<UserProfile> => {
  // 現在のプロフィールを取得
  const currentProfile = await getExtendedProfile(userId, supabaseClient);
  
  // 現在のメタデータを取得
  const currentMetadata = currentProfile?.metadata as Record<string, any> || {};
  
  // 新しいメタデータを作成
  const newMetadata = {
    ...currentMetadata,
    [key]: value
  };
  
  // プロフィールの更新
  return await updateExtendedProfile(userId, {
    metadata: newMetadata
  }, supabaseClient);
}; 