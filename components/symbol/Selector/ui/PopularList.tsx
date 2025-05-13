/**
 * components/symbol/Selector/ui/PopularList.tsx
 * 人気銘柄リストコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 */

"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, StarOff } from 'lucide-react';
import type { SymbolInfo } from '@/store/useSymbolStore';

interface PopularListProps {
  symbols: SymbolInfo[];
  currentSymbol: string;
  onSelect: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
}

/**
 * 人気銘柄リストコンポーネント
 * 
 * 人気のある銘柄のリストを表示します。
 */
export const PopularList = ({
  symbols,
  currentSymbol,
  onSelect,
  onToggleFavorite
}: PopularListProps) => {
  if (symbols.length === 0) return null;
  
  return (
    <div className="border rounded-md mb-4">
      <div className="p-2 bg-muted/50 border-b flex justify-between items-center">
        <span className="text-sm font-medium">人気銘柄</span>
        <Badge variant="outline">{symbols.length}件</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
        {symbols.map((symbol) => (
          <Button
            key={symbol.symbol}
            variant={currentSymbol === symbol.symbol ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(symbol.symbol)}
            className="justify-between h-auto py-2"
          >
            <div className="flex flex-col items-start">
              <div className="flex items-center">
                <span className="font-medium">{symbol.baseAsset}</span>
                <span className="text-muted-foreground text-xs ml-1">/{symbol.quoteAsset}</span>
              </div>
              <span className="text-xs text-muted-foreground">{symbol.symbol}</span>
            </div>
            <div
              className="inline-flex items-center justify-center h-6 w-6 ml-1 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(symbol.symbol);
              }}
            >
              {symbol.isFavorite ? (
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              ) : (
                <StarOff className="h-3.5 w-3.5" />
              )}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PopularList; 