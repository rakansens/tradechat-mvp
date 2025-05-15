// lib/supabase/features/profile.ts
// Supabaseプロフィール拡張ユーティリティ（SSR対応版）
// 作成日: 2025/6/15
// 更新日: 2025/6/20 - SSRクライアント対応
// 更新日: 2025/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())
// 更新日: 2025/9/15 - エラーハンドリング強化、型安全性向上
// 更新日: 2025/9/16 - metadataのnull/undefined処理修正、リンターエラー解消

import { createClient } from '@/lib/supabase/client';
import { UserProfile, ProfileInsert, ProfileUpdate } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/network/supabase';

/**
 * エラーログを出力（後で監視システムに接続できるよう拡張）
 * @param message エラーメッセージ
 * @param error エラーオブジェクト
 * @param metadata 追加メタデータ
 */
function logError(message: string, error: any, metadata?: Record<string, any>) {
  console.error(`[ProfileError] ${message}:`, error, metadata || {});
  // TODO: 本番環境では監視システムに送信する処理を追加
}

/**
 * ユーザープロフィールを取得（メタデータ対応）
 * @param userId ユーザーID
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 拡張ユーザープロフィール
 */
export const getExtendedProfile = async (
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<UserProfile | null> => {
  if (!userId) {
    logError('getExtendedProfile: ユーザーIDが指定されていません', { userId });
    throw new Error('ユーザーIDは必須です');
  }

  try {
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
  } catch (error: any) {
    logError(`プロフィール取得エラー: ${userId}`, error, { operation: 'getExtendedProfile' });
    throw new Error(`プロフィールの取得に失敗しました: ${error.message || error}`);
  }
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
  supabaseClient?: SupabaseClient<Database>
): Promise<UserProfile> => {
  if (!userId) {
    logError('createExtendedProfile: ユーザーIDが指定されていません', { profile });
    throw new Error('ユーザーIDは必須です');
  }

  try {
    const supabase = supabaseClient ?? createClient();
    // プロフィールデータの準備
    const profileData: ProfileInsert = {
      user_id: userId,
      display_name: profile.display_name || null,
      avatar_url: profile.avatar_url || null,
      bio: profile.bio || null,
      // metadata: undefinedの場合はundefinedのままにする
      metadata: profile.metadata ? { ...profile.metadata } : undefined
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
  } catch (error: any) {
    logError(`プロフィール作成エラー: ${userId}`, error, { 
      operation: 'createExtendedProfile',
      profile_data: { ...profile, metadata: profile.metadata ? '...' : undefined }
    });
    throw new Error(`プロフィールの作成に失敗しました: ${error.message || error}`);
  }
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
    metadata?: Record<string, any> | null;
  },
  supabaseClient?: SupabaseClient<Database>
): Promise<UserProfile> => {
  if (!userId) {
    logError('updateExtendedProfile: ユーザーIDが指定されていません', { profile });
    throw new Error('ユーザーIDは必須です');
  }

  try {
    // 現在のプロフィールを取得
    const currentProfile = await getExtendedProfile(userId, supabaseClient);
    
    // 新しいメタデータの準備
    // メタデータの処理: nullが明示的に指定された場合は空のオブジェクトを使用
    let metadataToUse: Record<string, any> | undefined = undefined;
    
    if (profile.metadata === null) {
      // メタデータを明示的にクリア（空オブジェクト）
      metadataToUse = {};
    } else if (profile.metadata) {
      // 既存のメタデータとマージ
      metadataToUse = {
        ...((currentProfile?.metadata || {}) as Record<string, any>),
        ...profile.metadata
      };
    } else {
      // 変更なし - 現在の値を使用
      metadataToUse = currentProfile?.metadata as Record<string, any> | undefined;
    }
    
    // 更新データの準備
    const updates: ProfileUpdate = {
      display_name: profile.display_name ?? currentProfile?.display_name ?? null,
      avatar_url: profile.avatar_url ?? currentProfile?.avatar_url ?? null,
      bio: profile.bio ?? currentProfile?.bio ?? null,
      metadata: metadataToUse
    };
    
    // プロフィールが存在しない場合は作成、存在する場合は更新
    if (!currentProfile) {
      return await createExtendedProfile(userId, {
        display_name: updates.display_name === null ? undefined : updates.display_name,
        avatar_url: updates.avatar_url === null ? undefined : updates.avatar_url,
        bio: updates.bio === null ? undefined : updates.bio,
        metadata: metadataToUse
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
  } catch (error: any) {
    logError(`プロフィール更新エラー: ${userId}`, error, { 
      operation: 'updateExtendedProfile',
      fields_updated: Object.keys(profile)
    });
    throw new Error(`プロフィールの更新に失敗しました: ${error.message || error}`);
  }
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
  supabaseClient?: SupabaseClient<Database>
): Promise<UserProfile> => {
  if (!userId || !key) {
    logError('updateProfileMetadata: 必須パラメータが不足しています', { userId, key });
    throw new Error('ユーザーIDとメタデータキーは必須です');
  }

  try {
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
  } catch (error: any) {
    logError(`メタデータ更新エラー: ${userId}/${key}`, error, { 
      operation: 'updateProfileMetadata',
      key,
      value_type: typeof value
    });
    throw new Error(`プロフィールメタデータの更新に失敗しました: ${error.message || error}`);
  }
}; 