'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PollingStatusPanelProps {
  pollingStatus: Record<string, any>;
}

/**
 * ポーリング状態表示パネルコンポーネント
 * 
 * 各種ポーリングの状態を表示するコンポーネント
 */
export function PollingStatusPanel({ pollingStatus }: PollingStatusPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">ポーリング状態</h3>
        <p className="text-sm text-gray-500">自動更新の状態</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">オーダーブックポーリング</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">ステータス:</span>
                <Badge variant={pollingStatus?.orderbook?.active ? 'default' : 'outline'}>
                  {pollingStatus?.orderbook?.active ? 'アクティブ' : '停止中'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">更新間隔:</span>
                <span>{pollingStatus?.orderbook?.interval ? `${pollingStatus.orderbook.interval / 1000}秒` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">最終更新:</span>
                <span>
                  {pollingStatus?.orderbook?.lastPollTime
                    ? new Date(pollingStatus.orderbook.lastPollTime).toLocaleTimeString()
                    : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">市場データポーリング</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">ステータス:</span>
                <Badge variant={pollingStatus?.marketData?.active ? 'default' : 'outline'}>
                  {pollingStatus?.marketData?.active ? 'アクティブ' : '停止中'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">更新間隔:</span>
                <span>{pollingStatus?.marketData?.interval ? `${pollingStatus.marketData.interval / 1000}秒` : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">最終更新:</span>
                <span>
                  {pollingStatus?.marketData?.lastPollTime
                    ? new Date(pollingStatus.marketData.lastPollTime).toLocaleTimeString()
                    : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 