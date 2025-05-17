/**
 * components/market/orderbook/ui/BidsTable.tsx
 * 作成: 買い注文（bids）を表示するテーブルコンポーネント
 */

import React, { memo } from 'react';
import { OrderBookEntry } from '@/types/common/orderbook';
import PriceRow from './PriceRow';

interface BidsTableProps {
  // 表示する買い注文データ
  bids: (OrderBookEntry & { total?: number })[];
  // フォーマット関数
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatTotal: (total: number) => string;
}

/**
 * 買い注文（bids）テーブルコンポーネント
 * 各行は緑色で表示
 */
const BidsTable = memo(function BidsTable({
  bids,
  formatPrice,
  formatAmount,
  formatTotal
}: BidsTableProps) {
  return (
    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-[#2A2E39] scrollbar-track-[#131722] flex-1">
      {bids.map((bid, index) => (
        <PriceRow 
          key={`bid-${index}`}
          entry={bid}
          type="bid"
          formatPrice={formatPrice}
          formatAmount={formatAmount}
          formatTotal={formatTotal}
        />
      ))}
    </div>
  );
});

export default BidsTable; 