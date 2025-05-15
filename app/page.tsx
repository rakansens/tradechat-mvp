// app/page.tsx
// トップページ - ダッシュボード
// 更新日: 2023/6/25 - 型変換関数を使用して型エラーを修正

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getOpenEntries } from '@/lib/supabase/features/entry';
import { fromSupabaseEntry } from '@/types/entry';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ChartSection from '@/components/chart/container';
import EntryList from '@/components/entry/EntryList';
import MarketSection from '@/components/market/MarketSection';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Dashboard | TradingMVP',
  description: 'トレード分析とポートフォリオ管理のためのダッシュボード',
};

// ダッシュボードでオープンエントリーを取得
async function OpenEntriesSection() {
  // 公開エントリーを取得
  const data = await getOpenEntries(true);
  
  // Supabaseのエントリー型からクライアント型に変換
  const openEntries = data.map(entry => fromSupabaseEntry(entry));
  
  return (
    <EntryList entries={openEntries} title="オープンエントリー" />
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ChartSection />
        </div>
        <div>
          <MarketSection />
          <div className="mt-4">
            <Suspense fallback={<Skeleton className="h-64" />}>
              <OpenEntriesSection />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
