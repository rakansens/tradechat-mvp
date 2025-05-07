// lib/supabase-relations.ts
// Supabaseユーザー関係（フォロー/フォロワー）関連ユーティリティ関数
// 作成日: 2025/5/7

import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type UserRelation = Database['public']['Tables']['user_relations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

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

  const { data, error } = await supabase
    .from('user_relations')
    .insert([
      {
        follower_id: followerId,
        following_id: followingId,
      },
    ])
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

  // プロフィール情報を抽出
  return data.map(item => item.profiles) as Profile[];
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

  // プロフィール情報を抽出
  return data.map(item => item.profiles) as Profile[];
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

  // プロフィール情報を抽出
  return data.map(item => item.profiles) as Profile[];
};

/**
 * フォロー関係のリアルタイム購読
 * @param userId ユーザーID
 * @param callback コールバック関数
 * @returns 購読解除関数
 */
export const subscribeToUserRelations = (
  userId: string,
  callback: (relation: UserRelation, eventType: 'INSERT' | 'DELETE') => void
) => {
  const channel = supabase
    .channel('user_relations')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'user_relations',
        filter: `follower_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as UserRelation, 'INSERT');
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'user_relations',
        filter: `follower_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.old as UserRelation, 'DELETE');
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};