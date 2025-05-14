// lib/supabase-relations.ts
// Supabaseユーザー関係（フォロー/フォロワー）関連ユーティリティ関数
// 更新日: 2025/5/14 - 型参照を最新の型定義に更新し、型安全性を強化

import { supabase } from './supabase';
import { Tables, TablesInsert } from '@/types/network/supabase';

// ユーザー関係の型定義
type UserRelation = Tables<'user_relations'>;
type UserRelationInsert = TablesInsert<'user_relations'>;
type Profile = Tables<'profiles'>;

// 型安全な処理のためのインターフェース
interface RelationWithProfile {
  following_id?: string;
  follower_id?: string;
  profiles: unknown;
}

/**
 * ユーザーをフォローする
 * @param followerId フォローするユーザーID
 * @param followingId フォローされるユーザーID
 * @returns フォロー結果
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<UserRelation> => {
  // 自分自身をフォローできないようにチェック
  if (followerId === followingId) {
    throw new Error('自分自身をフォローすることはできません');
  }

  const relationData: UserRelationInsert = {
    follower_id: followerId,
    following_id: followingId,
  };

  const { data, error } = await supabase
    .from('user_relations')
    .insert([relationData])
    .select()
    .single();

  if (error) {
    // 既にフォローしている場合は特別なエラーメッセージを返す
    if (error.code === '23505') {
      throw new Error('既にフォローしています');
    }
    throw error;
  }

  return data;
};

/**
 * ユーザーのフォローを解除する
 * @param followerId フォローを解除するユーザーID
 * @param followingId フォローを解除されるユーザーID
 * @returns フォロー解除結果
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_relations')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * ユーザーがフォローしているかどうかを確認する
 * @param followerId フォローしているユーザーID
 * @param followingId フォローされているユーザーID
 * @returns フォローしているかどうか
 */
export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_relations')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
};

/**
 * プロフィールオブジェクトの型チェック
 */
function isValidProfile(profile: unknown): profile is Profile {
  return (
    !!profile &&
    typeof profile === 'object' &&
    'id' in profile &&
    'user_id' in profile
  );
}

/**
 * ユーザーのフォロー一覧を取得する
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns フォロー一覧
 */
export const getFollowing = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('user_relations')
    .select('following_id, profiles!user_relations_following_id_fkey(*)')
    .eq('follower_id', userId)
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  // プロフィール情報を抽出して型安全に処理
  const profiles: Profile[] = [];
  
  for (const item of data as RelationWithProfile[]) {
    if (isValidProfile(item.profiles)) {
      profiles.push(item.profiles as Profile);
    }
  }
  
  return profiles;
};

/**
 * ユーザーのフォロワー一覧を取得する
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns フォロワー一覧
 */
export const getFollowers = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('user_relations')
    .select('follower_id, profiles!user_relations_follower_id_fkey(*)')
    .eq('following_id', userId)
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  // プロフィール情報を抽出して型安全に処理
  const profiles: Profile[] = [];
  
  for (const item of data as RelationWithProfile[]) {
    if (isValidProfile(item.profiles)) {
      profiles.push(item.profiles as Profile);
    }
  }
  
  return profiles;
};

/**
 * ユーザーのフォロー数を取得する
 * @param userId ユーザーID
 * @returns フォロー数
 */
export const getFollowingCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('user_relations')
    .select('id', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    throw error;
  }

  return count || 0;
};

/**
 * ユーザーのフォロワー数を取得する
 * @param userId ユーザーID
 * @returns フォロワー数
 */
export const getFollowersCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('user_relations')
    .select('id', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    throw error;
  }

  return count || 0;
};

/**
 * 相互フォローしているユーザー一覧を取得する
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns 相互フォローユーザー一覧
 */
export const getMutualFollows = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<Profile[]> => {
  // 自分がフォローしているユーザーを取得
  const { data: following, error: followingError } = await supabase
    .from('user_relations')
    .select('following_id')
    .eq('follower_id', userId);

  if (followingError) {
    throw followingError;
  }

  if (!following || following.length === 0) {
    return [];
  }

  // フォローしているユーザーIDの配列を作成
  const followingIds = following.map(item => item.following_id);

  // 相互フォローしているユーザーを取得
  const { data, error } = await supabase
    .from('user_relations')
    .select('follower_id, profiles!user_relations_follower_id_fkey(*)')
    .eq('following_id', userId)
    .in('follower_id', followingIds)
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  // プロフィール情報を抽出して型安全に処理
  const profiles: Profile[] = [];
  
  for (const item of data as RelationWithProfile[]) {
    if (isValidProfile(item.profiles)) {
      profiles.push(item.profiles as Profile);
    }
  }
  
  return profiles;
};

/**
 * ユーザー関係のリアルタイム購読
 * @param userId ユーザーID
 * @param callback コールバック関数
 * @returns 購読解除関数
 */
export const subscribeToUserRelations = (
  userId: string,
  callback: (relation: UserRelation, eventType: 'INSERT' | 'DELETE') => void
) => {
  // フォロワーの変更を購読 (ユーザーがフォローされたとき)
  const followersChannel = supabase
    .channel('followers_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_relations',
        filter: `following_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as UserRelation, payload.eventType as 'INSERT' | 'DELETE');
      }
    )
    .subscribe();

  // フォロー中の変更を購読 (ユーザーが他のユーザーをフォローしたとき)
  const followingChannel = supabase
    .channel('following_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_relations',
        filter: `follower_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as UserRelation, payload.eventType as 'INSERT' | 'DELETE');
      }
    )
    .subscribe();

  // 購読解除関数を返す
  return () => {
    supabase.removeChannel(followersChannel);
    supabase.removeChannel(followingChannel);
  };
};