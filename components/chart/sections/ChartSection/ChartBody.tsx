/**
 * components/chart/sections/ChartSection/ChartBody.tsx
 * チャートセクションのボディ部分
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 */

"use client"

import React from 'react';
import ChartCanvas from "@/components/chart/Canvas";
import ErrorDisplay from "@/components/common/ErrorDisplay";
import { OrderBook } from "@/components/market";
import type { Timeframe } from "@/types/chart";
import type { ExchangeType } from "@/types/constants/enums";

interface ChartBodyProps {
  // 表示データ
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  
  // アクション
  setExchangeType: (type: ExchangeType) => void;
  onRetry: () => void;
}

/**
 * チャートセクションのボディコンポーネント
 * 
 * チャートキャンバスとオーダーブックを表示します。
 * ローディング状態やエラー表示も処理します。
 */
export const ChartBody: React.FC<ChartBodyProps> = ({
  isLoading,
  error,
  currentSymbol,
  currentTimeFrame,
  setExchangeType,
  onRetry
}) => {
  return (
    <div className="relative flex flex-grow flex-col md:flex-row">
      {/* チャート部分 */}
      <div className="relative w-full h-1/2 md:h-full md:w-3/4 lg:w-3/4">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#131722] bg-opacity-80">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2962FF]"></div>
          </div>
        ) : error ? (
          <ErrorDisplay
            error={error}
            onRetry={onRetry}
            alternativeActions={
              error?.includes('先物取引で利用できません') || error?.includes('先物取引でサポートされていません')
                ? [
                    {
                      label: 'Bitgetに切り替える',
                      action: () => {
                        setExchangeType('bitget');
                      }
                    }
                  ]
                : undefined
            }
          />
        ) : (
          <ChartCanvas />
        )}
      </div>
      
      {/* オーダーブック部分 */}
      <div className="w-full h-1/2 md:h-full md:w-1/4 lg:w-1/4 border-t md:border-t-0 md:border-l border-[#2A2E39] bg-[#131722]">
        <div className="h-full flex flex-col">
          <OrderBook
            depth={15}
            className="h-full"
            orderBookWidth="25%"
          />
        </div>
      </div>
    </div>
  );
}; 