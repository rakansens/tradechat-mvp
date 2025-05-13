'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CacheStatsPanelProps {
  cacheStats: Record<string, any>;
}

/**
 * キャッシュ統計表示パネルコンポーネント
 * 
 * キャッシュの使用状況を表示するコンポーネント
 */
export function CacheStatsPanel({ cacheStats }: CacheStatsPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">キャッシュ統計</h3>
        <p className="text-sm text-gray-500">データキャッシュの使用状況</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(cacheStats).map(([key, stats]: [string, any]) => (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-base">{key}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">エントリ数:</span>
                  <span>{stats.count || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">ヒット率:</span>
                  <span>{stats.hitRate ? `${Math.round(stats.hitRate * 100)}%` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">最終アクセス:</span>
                  <span>
                    {stats.lastAccessed
                      ? new Date(stats.lastAccessed).toLocaleTimeString()
                      : '-'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {Object.keys(cacheStats).length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400">
            キャッシュデータはありません
          </div>
        )}
      </div>
    </div>
  );
} 