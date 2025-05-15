// src/mastra/integrations/index.ts
// 更新：Mem0統合のエクスポートファイル
// SupabaseMem0Integrationを使用してSupabaseとMem0の統合機能を提供
// 更新日: 2025/6/22 - Supabase SSRクライアント対応（インポートパス更新）

import { Mem0Integration } from "@mastra/mem0";
import { SupabaseMem0Integration } from "./mem0-supabase";
import { getCurrentUser } from "@/lib/supabase/features/auth";

// ユーザーIDを取得する非同期関数
// このIDはリアルタイムに更新されるべきなので、
// イニシャライズ後のユーザーID変更にも対応できるようにします
const getUserId = async (): Promise<string> => {
  try {
    const user = await getCurrentUser();
    return user?.id || "anon";
  } catch (error) {
    console.error("ユーザーID取得エラー:", error);
    return "anon";
  }
};

// Mem0統合インスタンスを作成
// 環境変数からMEM0_API_KEYを取得
export const mem0 = new SupabaseMem0Integration({
  apiKey: process.env.MEM0_API_KEY || "",
  userId: "anon", // 初期値としてanonを使用
});

// アプリケーション起動時にユーザーIDを設定
// (サーバーサイドでは初期化時のみ、クライアントサイドでは認証状態変更時にも実行される)
if (typeof window !== 'undefined') {
  // クライアントサイドのみで実行
  getUserId().then(userId => {
    mem0.setUserId(userId);
  });
  
  // 認証状態変更を監視（例：ログイン/ログアウト）
  // 実際の実装はアプリケーションの認証システムに依存します
  document.addEventListener('authStateChanged', async () => {
    const userId = await getUserId();
    mem0.setUserId(userId);
  });
}

// 旧Mem0Integrationもexportして後方互換性を保持
// 注: このexportは将来的に削除予定
export const legacyMem0 = new Mem0Integration({
  config: {
    apiKey: process.env.MEM0_API_KEY!,
    userId: "anon",
  },
});
