/**
 * components/market/orderbook/ui/SpreadBar.tsx
 * 作成: 売り注文と買い注文の間に表示されるスプレッド情報バーコンポーネント
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface SpreadBarProps {
  // スプレッド（最低売り価格と最高買い価格の差）
  spread: number;
  // スプレッドの割合（%）
  spreadPercent: number;
  // 追加のスタイルクラス
  className?: string;
}

/**
 * スプレッド情報表示バーコンポーネント
 * 売り注文と買い注文の間に配置
 */
const SpreadBar = memo(function SpreadBar({
  spread,
  spreadPercent,
  className
}: SpreadBarProps) {
  return (
    <div className={cn(
      "py-1 px-2 text-xs text-center bg-[#1E222D] border-y border-[#2A2E39] font-medium",
      className
    )}>
      <span className="text-white">スプレッド:</span>{' '}
      <span className="text-[#9CA3AF]">
        {spread.toFixed(2)} ({spreadPercent.toFixed(2)}%)
      </span>
    </div>
  );
});

export default SpreadBar;