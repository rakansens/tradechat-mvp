/**
 * components/chart/sections/ChartSection/ChartHeader.tsx
 * チャートセクションのヘッダー部分
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 */

"use client"

import React from 'react';
import { Badge } from "@/components/ui/badge";

interface ChartHeaderProps {
  // 表示データ
  currentSymbol: string;
  currentPrice: number;
  priceChangePercent: number;
  formattedDateRange: string;
  // クライアントサイド表示用
  mounted: boolean;
}

/**
 * チャートセクションのヘッダーコンポーネント
 * 
 * シンボル名、価格情報、日付範囲などのメタデータを表示します。
 */
export const ChartHeader: React.FC<ChartHeaderProps> = ({
  currentSymbol,
  currentPrice,
  priceChangePercent,
  formattedDateRange,
  mounted
}) => {
  // クライアントサイドでのみ表示する値
  const displayPriceChangePercent = mounted ? priceChangePercent : 0;

  return (
    <div className="px-4 py-2 bg-[#131722] border-b border-[#2A2E39]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-white">{mounted ? currentSymbol : ''}</h2>
          {mounted && currentPrice > 0 && (
            <span className="ml-2 text-lg font-mono">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
          {mounted && displayPriceChangePercent !== 0 && (
            <Badge className="ml-2" variant={displayPriceChangePercent >= 0 ? "success" : "destructive"}>
              {displayPriceChangePercent >= 0 ? '+' : ''}{displayPriceChangePercent.toFixed(2)}%
            </Badge>
          )}
        </div>
        {mounted && formattedDateRange && (
          <div className="text-xs text-[#9CA3AF]">
            {formattedDateRange}
          </div>
        )}
      </div>
    </div>
  );
}; 