// lib/supabase.ts
// Supabaseクライアント初期化ファイル
// 作成日: 2025/5/7
// 更新日: 2025/5/14 - 型参照を@/types/network/supabaseに更新

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/network/supabase';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 環境変数が設定されていない場合はエラーを表示
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

// Supabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// サーバーサイドでのみ使用するクライアント
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  );
};

// ブラウザ環境でのみ実行される認証状態の監視
if (typeof window !== 'undefined') {
  // 認証状態の変更を監視
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      console.log('ユーザーがサインインしました', session?.user);
    } else if (event === 'SIGNED_OUT') {
      console.log('ユーザーがサインアウトしました');
    }
  });
}