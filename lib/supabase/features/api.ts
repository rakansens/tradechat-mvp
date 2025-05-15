// lib/supabase/features/api.ts
// Supabase API専用ユーティリティ関数（SSR対応版）
// 作成日: 2025/6/21 - 初期実装、supabase-api.tsからの移行
// 更新日: 2025/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())

import { createClient } from '@/lib/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase APIの接続状態を確認するためのヘルスチェック関数
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 接続が正常な場合はtrue、それ以外はfalse
 */
export const checkApiHealth = async (supabaseClient?: SupabaseClient): Promise<boolean> => {
  try {
    const supabase = supabaseClient ?? createClient();
    // シンプルなクエリを実行して接続状態を確認
    // データベース内の任意の既存テーブルでチェック
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error) {
      console.error('API接続エラー:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('API健全性チェックエラー:', error);
    return false;
  }
};

/**
 * APIバージョン情報を取得
 * @returns バージョン情報
 */
export const getApiVersion = async (): Promise<Record<string, string>> => {
  // 実際の環境ではRPC経由でバージョン情報を取得することが多いです
  // このサンプル実装では固定値を返します
  return {
    version: '1.0.0',
    releaseDate: '2025/6/21',
    environment: process.env.NODE_ENV || 'development'
  };
};

/**
 * サーバー時間を取得（クライアント時間との同期用）
 * @returns サーバー時間
 */
export const getServerTime = async (): Promise<Date> => {
  try {
    // Supabaseの実際の実装では、RPCで現在時刻を取得する関数を実装することが多いです
    // このモック実装では、クライアント時間を返します
    return new Date();
  } catch (error) {
    console.error('サーバー時間取得エラー:', error);
    return new Date();
  }
};

/**
 * API使用状況を取得（開発・デバッグ用）
 * @returns API使用状況
 */
export const getApiUsage = async (): Promise<Record<string, any>> => {
  // このサンプル実装では固定値を返します
  return {
    dailyRequests: 1250,
    monthlyRequests: 32480,
    averageResponseTime: 120, // ms
    lastUpdated: new Date().toISOString()
  };
};

/**
 * API使用制限をチェック
 * @param userId ユーザーID
 * @param supabaseClient オプションの Supabase クライアントインスタンス
 * @returns 制限情報
 */
export const checkApiLimits = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Record<string, any>> => {
  const supabase = supabaseClient ?? createClient();
  // このサンプル実装では固定値を返します
  return {
    remainingRequests: 9750,
    maxRequests: 10000,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isLimited: false
  };
}; 