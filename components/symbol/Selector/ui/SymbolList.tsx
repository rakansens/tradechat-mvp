/**
 * components/symbol/Selector/ui/SymbolList.tsx
 * 銘柄リストコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 2025-05-17: T-7.6フェーズ - 型インポートパスと属性名を修正
 * - 2025-06-05: T-7.7.1フェーズ - 型インポートパスを@/types/common/symbolに変更
 * - 2025-06-05: T-7.7.4フェーズ - lucide-react v0.36対応 (Star/StarOffに変更)
 */

"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, StarOff } from 'lucide-react';
import { validateSymbolInfo } from '@/lib/validations/symbol';
import type { SymbolInfo } from '@/types/common/symbol';

interface SymbolListProps {
  symbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  onSelect: (symbol: string) => void;
  onToggleFavorite: (symbol: string) => void;
  onRetry: () => void;
}

/**
 * 銘柄リストコンポーネント
 * 
 * 検索結果の銘柄一覧を表示します。読み込み中の状態、エラー状態も処理します。
 */
export const SymbolList = ({
  symbols,
  isLoading,
  error,
  currentSymbol,
  onSelect,
  onToggleFavorite,
  onRetry
}: SymbolListProps) => {
  return (
    <div className="border rounded-md">
      <div className="p-2 bg-muted/50 border-b flex justify-between items-center">
        <span className="text-sm font-medium">銘柄一覧</span>
        <Badge variant="outline">
          {isLoading ? '読み込み中...' : `${symbols.length}件`}
        </Badge>
      </div>
      
      {/* エラー表示 */}
      {error && (
        <div className="p-4 text-center text-red-500">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-2"
          >
            再試行
          </Button>
        </div>
      )}
      
      {isLoading ? (
        <div className="p-4 space-y-2">
          {Array(8).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
            {symbols.length === 0 ? (
              <div className="col-span-2 p-4 text-center text-muted-foreground">
                該当する銘柄がありません
              </div>
            ) : (
              symbols.map((symbol) => {
                // シンボル情報のバリデーション
                const symbolValidation = validateSymbolInfo(symbol);
                if (!symbolValidation.success) {
                  console.warn(`Symbol validation failed for ${symbol.symbol}:`, symbolValidation.error);
                  return null; // 無効なシンボルはスキップ
                }
                
                return (
                  <Button
                    key={symbol.symbol}
                    variant={currentSymbol === symbol.symbol ? "default" : "outline"}
                    size="sm"
                    onClick={() => onSelect(symbol.symbol)}
                    className="justify-between h-auto py-2"
                  >
                  <div className="flex flex-col items-start">
                    <div className="flex items-center">
                      <span className="font-medium">{symbol.baseCoin}</span>
                      <span className="text-muted-foreground text-xs ml-1">/{symbol.quoteCoin}</span>
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
                    {symbol.favorite ? (
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-3.5 w-3.5" />
                    )}
                  </div>
                </Button>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default SymbolList; 