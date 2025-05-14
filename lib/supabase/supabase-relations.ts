// lib/supabase/supabase-relations.ts
// ユーザー関係管理ユーティリティ関数
// 作成日: 2025/5/14
// 更新日: 2025/6/15 - 当面の開発フェーズでは優先度が低いためプレースホルダーとして保持

import { supabase } from './supabase';

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
export const followUser = async (followerId: string, followingId: string): Promise<boolean> => {
  console.warn('フォロー機能は現在実装されていません');
  return true;
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<boolean> => {
  console.warn('フォロー解除機能は現在実装されていません');
  return true;
};

export const getUserFollowers = async (userId: string): Promise<any[]> => {
  console.warn('フォロワー取得機能は現在実装されていません');
  return [];
};

export const getUserFollowing = async (userId: string): Promise<any[]> => {
  console.warn('フォロー中ユーザー取得機能は現在実装されていません');
  return [];
};

export const searchUsers = async (query: string): Promise<any[]> => {
  console.warn('ユーザー検索機能は現在実装されていません');
  return [];
};
