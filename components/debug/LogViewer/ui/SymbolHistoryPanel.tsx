'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SymbolHistoryPanelProps {
  symbolHistory: any[];
}

/**
 * シンボル履歴表示パネルコンポーネント
 * 
 * シンボル変更の履歴を表示するコンポーネント
 */
export function SymbolHistoryPanel({ symbolHistory }: SymbolHistoryPanelProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">シンボル変更履歴</h3>
        <p className="text-sm text-gray-500">選択された通貨ペアの履歴</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>タイムスタンプ</TableHead>
            <TableHead>シンボル</TableHead>
            <TableHead>取引所タイプ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {symbolHistory.length > 0 ? (
            symbolHistory.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                <TableCell>{item.symbol}</TableCell>
                <TableCell>{item.exchangeType}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">シンボル変更履歴はありません</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 