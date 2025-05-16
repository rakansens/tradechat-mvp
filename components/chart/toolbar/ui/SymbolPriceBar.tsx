"use client"

// components/chart/toolbar/ui/SymbolPriceBar.tsx
// 作成: シンボル選択と価格表示を行うバーコンポーネント
// 役割:
// 1. 銘柄選択ボタンの表示
// 2. 現在価格と変化率のバッジ表示
// 更新: 2025-06-28 - Tailwindクラスに変更
// 更新: T-7.5フェーズ - currentPriceをnullableに変更
// 更新: T-7.8フェーズ - formatters.tsへの不要なインポートを削除

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CandlestickChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import SymbolSelectorModal from '../../SymbolSelectorModal';
import { ExchangeType } from '@/types/constants/enums';
import { SymbolSelector } from '@/components/symbol/Selector';
import { ExchangeSelector } from '@/components/symbol/ExchangeSelector';

interface SymbolPriceBarProps {
  // シンボル関連
  currentSymbol: string;
  exchangeType: ExchangeType;
  onSymbolChange: (symbol: string) => void;
  onExchangeTypeChange: (type: ExchangeType) => void;
  
  // 価格関連
  currentPrice: number | null;
  priceChangePercent: number | null;
  mounted: boolean; // クライアントサイドレンダリング用
}

/**
 * シンボル選択と価格表示を行うバーコンポーネント
 */
const SymbolPriceBar = memo(function SymbolPriceBar({
  // シンボル関連props
  currentSymbol,
  exchangeType,
  onSymbolChange,
  onExchangeTypeChange,
  
  // 価格関連props
  currentPrice,
  priceChangePercent,
  mounted
}: SymbolPriceBarProps) {
  return (
    <div className="flex items-center space-x-2">
      {/* 銘柄選択モーダル */}
      <SymbolSelectorModal
        currentSymbol={currentSymbol}
        exchangeType={exchangeType}
        onSymbolSelect={onSymbolChange}
        onExchangeTypeChange={onExchangeTypeChange}
        trigger={
          <Button variant="outline" size="sm" className="gap-1">
            <CandlestickChart className="h-4 w-4" />
            <span>{mounted ? currentSymbol : ''}</span>
          </Button>
        }
      />
      
      <Badge variant="outline" className="font-mono text-xs py-0.5 px-1.5 bg-background-tertiary border-border-light text-text-secondary">
        24h Vol: 12.5K
      </Badge>

      {/* 最新価格表示 */}
      <div className="relative z-10 flex items-center">
        {currentPrice !== null && currentPrice > 0 && (
          <Badge 
            variant="outline" 
            className="font-mono text-sm font-bold py-1 px-2 ml-2 bg-background-tertiary border-border-light text-text-primary shadow-md" 
          >
            ${currentPrice.toLocaleString('en-US')}
          </Badge>
        )}

        {/* 価格変化率表示 */}
        {priceChangePercent !== null && priceChangePercent !== 0 && (
          <Badge 
            variant="outline" 
            className={cn(
              "font-mono text-sm font-bold py-1 px-2 ml-2 bg-background-tertiary border-border-light shadow-md",
              priceChangePercent >= 0 ? "text-accent-green" : "text-accent-red"
            )}
          >
            {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </Badge>
        )}
      </div>
    </div>
  );
});

export default SymbolPriceBar; 