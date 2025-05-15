// lib/supabase/features/relations.ts
// ユーザー関係管理ユーティリティ関数（SSR対応版）
// 作成日: 2025/6/21 - 初期実装、supabase-relations.tsからの移行
// 更新日: 2025/9/17 - DIパターンを適用

import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/network/supabase';

/**
 * NOTE: この機能は現在の開発フェーズでは実装優先度が低いため保留中
 * 
 * 今後の実装予定:
 * - フォロー/フォロワー管理UI
 * - ユーザー検索機能
 * - アクティビティフィード
 * - ソーシャルインタラクション
 * - プロフィールページ連携
 * 
 * 実装時期: 未定（コアユーザー要望に応じて検討）
 */

// プレースホルダー関数 - 後日実装予定
export const followUser = async (
  followerId: string, 
  followingId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
  console.warn('フォロー機能は現在実装されていません');
  return true;
};

export const unfollowUser = async (
  followerId: string, 
  followingId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
  console.warn('フォロー解除機能は現在実装されていません');
  return true;
};

export const getUserFollowers = async (
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<any[]> => {
  const supabase = supabaseClient ?? createClient();
  console.warn('フォロワー取得機能は現在実装されていません');
  return [];
};

export const getUserFollowing = async (
  userId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<any[]> => {
  const supabase = supabaseClient ?? createClient();
  console.warn('フォロー中ユーザー取得機能は現在実装されていません');
  return [];
};

export const searchUsers = async (
  query: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<any[]> => {
  const supabase = supabaseClient ?? createClient();
  console.warn('ユーザー検索機能は現在実装されていません');
  return [];
}; 