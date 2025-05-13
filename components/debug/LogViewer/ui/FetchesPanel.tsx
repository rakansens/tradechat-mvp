'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FetchesPanelProps {
  activeFetches: any[];
  requestHistory: any[];
}

/**
 * フェッチリクエスト表示パネルコンポーネント
 * 
 * アクティブなフェッチリクエストとリクエスト履歴を表示するコンポーネント
 */
export function FetchesPanel({ activeFetches, requestHistory }: FetchesPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">アクティブなフェッチリクエスト</h3>
        <p className="text-sm text-gray-500">現在進行中のAPIリクエスト</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>リクエスト種別</TableHead>
            <TableHead>シンボル</TableHead>
            <TableHead>取引種別</TableHead>
            <TableHead>実行時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activeFetches.length > 0 ? (
            activeFetches.map((fetch, index) => (
              <TableRow key={index}>
                <TableCell>{fetch.type}</TableCell>
                <TableCell>{fetch.symbol}</TableCell>
                <TableCell>{fetch.exchangeType}</TableCell>
                <TableCell>{fetch.duration ? `${Math.round(fetch.duration / 1000)}秒` : '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">アクティブなリクエストはありません</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="mt-8 mb-4">
        <h3 className="text-lg font-medium">リクエスト履歴</h3>
        <p className="text-sm text-gray-500">最近のAPIリクエスト（最大50件）</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>リクエストキー</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead>所要時間</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requestHistory.length > 0 ? (
            requestHistory.map((req, index) => (
              <TableRow key={index}>
                <TableCell>{req.key}</TableCell>
                <TableCell>
                  <Badge variant={
                    req.status === 'completed' ? 'default' :
                    req.status === 'error' ? 'destructive' :
                    req.status === 'aborted' ? 'outline' : 'secondary'
                  }>
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>{req.duration ? `${req.duration}ms` : '-'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">リクエスト履歴はありません</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 