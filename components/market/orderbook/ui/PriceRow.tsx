/**
 * components/market/orderbook/ui/PriceRow.tsx
 * 作成: 単一の価格行を表示するUIコンポーネント
 */

import React, { memo } from 'react';
import { OrderBookEntry } from '@/types/common/orderbook';

interface PriceRowProps {
  // 表示するデータ
  entry: OrderBookEntry & { total?: number };
  // 価格の色 (buy/sell)
  type: 'bid' | 'ask';
  // フォーマット関数
  formatPrice: (price: number) => string;
  formatAmount: (amount: number) => string;
  formatTotal: (total: number) => string;
  // 背景の長さを決めるための係数
  intensityFactor?: number;
}

/**
 * 単一の価格行を表示するコンポーネント
 * 買い注文（緑）または売り注文（赤）として表示
 */
const PriceRow = memo(function PriceRow({
  entry,
  type,
  formatPrice,
  formatAmount,
  formatTotal,
  intensityFactor = 5
}: PriceRowProps) {
  // 背景の色とグラデーションの設定
  const bgColor = type === 'bid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
  const textColor = type === 'bid' ? 'text-[#22C55E]' : 'text-[#EF4444]';
  const bgStyle = {
    background: `linear-gradient(to left, ${bgColor} ${Math.min((entry.total || 0) * intensityFactor, 100)}%, transparent 0%)`
  };
  
  return (
    <div 
      className="grid grid-cols-3 text-[0.7rem] py-0.5 px-1 dark:hover:bg-[#1C2030]"
      style={bgStyle}
    >
      <div className={`text-left ${textColor}`}>{formatPrice(entry.price)}</div>
      <div className="text-right text-white">{formatAmount(entry.amount)}</div>
      <div className="text-right text-[#9CA3AF]">{formatTotal(entry.total || 0)}</div>
    </div>
  );
});

export default PriceRow; 