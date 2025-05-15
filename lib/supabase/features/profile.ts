// lib/supabase/features/profile.ts
// Supabaseプロフィール拡張ユーティリティ（SSR対応版）
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - SSRクライアント対応

import { createClient } from '@/lib/supabase/client';
import { UserProfile, ProfileInsert, ProfileUpdate } from '@/types/supabase';

/**
 * ユーザープロフィールを取得（メタデータ対応）
 * @param userId ユーザーID
 * @returns 拡張ユーザープロフィール
 */
export const getExtendedProfile = async (userId: string): Promise<UserProfile | null> => {
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
  
  // データベースから取得したプロフィールをUserProfile型に変換
  return data as UserProfile;
};

/**
 * ユーザープロフィールを作成（メタデータ対応）
 * @param userId ユーザーID
 * @param profile プロフィールデータ
 * @returns 作成された拡張ユーザープロフィール
 */
export const createExtendedProfile = async (
  userId: string,
  profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    metadata?: Record<string, any>;
  }
): Promise<UserProfile> => {
  const supabase = createClient();
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
 * @returns 更新された拡張ユーザープロフィール
 */
export const updateExtendedProfile = async (
  userId: string,
  profile: {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
    metadata?: Record<string, any>;
  }
): Promise<UserProfile> => {
  // 現在のプロフィールを取得
  const currentProfile = await getExtendedProfile(userId);
  
  // 新しいメタデータの準備
  // 現在のメタデータと新しいメタデータをマージ
  const mergedMetadata = {
    ...(currentProfile?.metadata || {}),
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
    });
  }
  
  const supabase = createClient();
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
 * @returns 更新された拡張ユーザープロフィール
 */
export const updateProfileMetadata = async (
  userId: string,
  key: string,
  value: any
): Promise<UserProfile> => {
  // 現在のプロフィールを取得
  const currentProfile = await getExtendedProfile(userId);
  
  // 現在のメタデータを取得
  const currentMetadata = currentProfile?.metadata || {};
  
  // 新しいメタデータを作成
  const newMetadata = {
    ...currentMetadata,
    [key]: value
  };
  
  // プロフィールの更新
  return await updateExtendedProfile(userId, {
    metadata: newMetadata
  });
}; 