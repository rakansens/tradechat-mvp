// lib/supabase-api.ts
// Supabase API専用ユーティリティ関数
// 作成日: 2025/5/7
// 更新日: 2025/6/5 - 再エクスポート構造を削除し、API特化の機能に変更

import { supabase } from './supabase';

/**
 * Supabase APIの接続状態を確認するためのヘルスチェック関数
 * @returns 接続が正常な場合はtrue、それ以外はfalse
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
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
    releaseDate: '2025/6/5',
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
 * @returns 制限情報
 */
export const checkApiLimits = async (userId: string): Promise<Record<string, any>> => {
  // このサンプル実装では固定値を返します
  return {
    remainingRequests: 9750,
    maxRequests: 10000,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isLimited: false
  };
};

// 注: 以前の再エクスポート構造は削除しました。
// 各機能は対応するモジュールから直接インポートしてください。
// 例: import { signIn } from './supabase-auth';