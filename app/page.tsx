// app/page.tsx
// トップページ - ダッシュボード
// 更新日: 2023/6/25 - 型変換関数を使用して型エラーを修正
// 更新日: 2025/6/26 - ユーザーIDをDashboardClientに渡すよう追加

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getOpenEntries } from '@/lib/supabase/features/entry';
import { fromSupabaseEntry } from '@/types/entry';
import type { Entry } from '@/types/entry';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from '@/app/DashboardClient';

export const metadata: Metadata = {
  title: 'TradingMVP Dashboard',
  description: 'トレード分析とポートフォリオ管理のためのダッシュボード',
};

export default async function Dashboard() {
  // サーバーサイドでSupabaseクライアントを初期化
  const supabase = createClient();
  
  // 現在のユーザーセッションを取得
  const { data: { session } } = await supabase.auth.getSession();
  
  // セッションがない場合はログインページにリダイレクト
  if (!session) {
    redirect('/signin');
  }
  
  // 公開エントリーを取得
  const entries = await getOpenEntries(true);
  
  // Supabaseのエントリー型からクライアント型に変換
  const convertedEntries = entries.map(entry => fromSupabaseEntry(entry));
  
  // デフォルトのチャートシンボルと時間枠
  const defaultSymbol = 'BTCUSD';
  const defaultTimeFrame = '1d';
  
  return (
    <DashboardClient
      initialEntries={convertedEntries as any} // 型互換性のために一時的にanyを使用
      initialCurrentSymbol={defaultSymbol}
      initialCurrentTimeFrame={defaultTimeFrame}
      userId={session.user.id}
    />
  );
}
