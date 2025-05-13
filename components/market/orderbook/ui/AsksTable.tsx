/**
 * components/market/orderbook/ui/AsksTable.tsx
 * 作成: 売り注文（asks）を表示するテーブルコンポーネント
 */

import React, { memo } from 'react';
import { OrderBookEntry } from '@/types/market';
import PriceRow from './PriceRow';

interface AsksTableProps {
  // 表示する売り注文データ
  asks: (OrderBookEntry & { total?: number })[];
  // フォーマット関数
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatTotal: (total: number) => string;
}

/**
 * 売り注文（asks）テーブルコンポーネント
 * 各行は赤色で表示
 */
const AsksTable = memo(function AsksTable({
  asks,
  formatPrice,
  formatAmount,
  formatTotal
}: AsksTableProps) {
  return (
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2E39] scrollbar-track-[#131722] flex-1">
      {asks.map((ask, index) => (
        <PriceRow 
          key={`ask-${index}`}
          entry={ask}
          type="ask"
          formatPrice={formatPrice}
          formatAmount={formatAmount}
          formatTotal={formatTotal}
        />
      ))}
    </div>
  );
});

export default AsksTable; 