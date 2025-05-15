// lib/supabase/supabase.ts
// 廃止予定のSupabaseクライアント初期化ファイル
// 作成日: 2025/5/7
// 更新日: 2025/5/14 - 型参照を@/types/network/supabaseに更新
// 更新日: 2025/8/28 - 廃止予定のため警告を追加

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/network/supabase';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 廃止予定の警告
const deprecationWarning = () => {
  console.warn(
    '⚠️ 警告: lib/supabase/supabase.ts は廃止予定です。\n' +
    'ブラウザ用クライアント: @/lib/supabase/client を使用してください。\n' +
    'サーバー用クライアント: @/lib/supabase/server を使用してください。\n' +
    'Route Handler用クライアント: @/lib/supabase/routeHandlerClient を使用してください。'
  );
};

// 環境変数が設定されていない場合はエラーを表示
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase環境変数が設定されていません。.env.localファイルを確認してください。');
}

// Supabaseクライアントの作成
export const supabase = (() => {
  deprecationWarning();
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
})();

// サーバーサイドでのみ使用するクライアント
export const createServerSupabaseClient = () => {
  deprecationWarning();
  console.warn('代わりに @/lib/supabase/server からの createClient() を使用してください');
  
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