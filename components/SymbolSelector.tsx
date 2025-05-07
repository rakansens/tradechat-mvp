'use client';

// components/SymbolSelector.tsx
// 作成: 銘柄選択コンポーネント
// 銘柄の検索、フィルタリング、選択機能を提供する
// 更新: Zodバリデーションの適用

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { ExchangeType } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Star, StarOff, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  validateSymbolSelectorProps,
  validateFilterOptions,
  validateSymbolInfo,
  type SymbolSelectorPropsSchema
} from '@/lib/validations/symbol';

export default function SymbolSelector({
  onSelect,
  currentSymbol = 'BTCUSDT',
  defaultExchangeType = 'spot',
  onExchangeTypeChange,
}: SymbolSelectorPropsSchema) {
  // プロパティのバリデーション
  const propsValidation = validateSymbolSelectorProps({
    onSelect,
    currentSymbol,
    defaultExchangeType,
    onExchangeTypeChange
  });
  
  if (!propsValidation.success) {
    console.warn('SymbolSelector props validation failed:', propsValidation.error);
  }
  // AppStoreから状態とアクションを取得
  const {
    filteredSymbols,
    isLoadingSymbols: isLoading,
    symbolError: error,
    fetchSymbols,
    setFilterOptions,
    toggleFavorite,
    clearFilters,
    filterOptions
  } = useAppStore();
  
  // 取引タイプの状態
  const [exchangeType, setExchangeType] = useState<ExchangeType>(defaultExchangeType);
  
  // 一般的な基軸通貨
  const commonQuoteAssets = ['USDT', 'USD', 'BTC', 'ETH'];
  
  // 初回レンダリング時に銘柄を取得
  useEffect(() => {
    fetchSymbols(exchangeType);
  }, [fetchSymbols, exchangeType]);
  
  // 取引タイプ変更時の処理
  const handleExchangeTypeChange = (value: string) => {
    setExchangeType(value as ExchangeType);
    fetchSymbols(value as ExchangeType);
    onExchangeTypeChange?.(value as ExchangeType);
  };
  
  // フィルターオプションのバリデーション
  useEffect(() => {
    const filterValidation = validateFilterOptions(filterOptions);
    if (!filterValidation.success) {
      console.warn('Filter options validation failed:', filterValidation.error);
    }
  }, [filterOptions]);

  // 検索処理
  const handleSearch = (term: string) => {
    // 検索語のバリデーション
    const searchTerm = term.trim();
    setFilterOptions({ searchTerm });
  };
  
  // 基軸通貨フィルター処理
  const handleQuoteAssetFilter = (asset: string) => {
    // 基軸通貨のバリデーション
    const quoteAsset = asset.trim();
    setFilterOptions({ quoteAsset });
  };
  
  // お気に入りフィルター処理
  const handleFavoritesToggle = () => {
    setFilterOptions({ favoritesOnly: !filterOptions.favoritesOnly });
  };
  
  return (
    <div className="w-full space-y-4">
      {/* 取引タイプの選択 */}
      <Tabs defaultValue={exchangeType} onValueChange={handleExchangeTypeChange}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="spot">現物</TabsTrigger>
          <TabsTrigger value="futures">先物</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* 検索フィールド */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="銘柄を検索..."
          value={filterOptions.searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 pr-8"
        />
        {filterOptions.searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => handleSearch('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* フィルターオプション */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filterOptions.favoritesOnly ? "default" : "outline"} 
          size="sm" 
          onClick={handleFavoritesToggle}
          className="flex gap-1"
        >
          {filterOptions.favoritesOnly ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
          お気に入り
        </Button>
        
        {filterOptions.searchTerm || filterOptions.quoteAsset || filterOptions.favoritesOnly ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => clearFilters()}
          >
            フィルターをクリア
          </Button>
        ) : null}
      </div>
      
      {/* 基軸通貨フィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={!filterOptions.quoteAsset ? "default" : "outline"} 
          size="sm" 
          onClick={() => handleQuoteAssetFilter('')}
        >
          すべて
        </Button>
        
        {commonQuoteAssets.map(asset => (
          <Button
            key={asset}
            variant={filterOptions.quoteAsset === asset ? "default" : "outline"}
            size="sm"
            onClick={() => handleQuoteAssetFilter(asset)}
          >
            {asset}
          </Button>
        ))}
      </div>
      
      {/* エラー表示 */}
      {error && (
        <div className="p-4 text-center text-red-500">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchSymbols(exchangeType)}
            className="ml-2"
          >
            再試行
          </Button>
        </div>
      )}
      
      {/* 銘柄リスト */}
      <div className="border rounded-md">
        <div className="p-2 bg-muted/50 border-b flex justify-between items-center">
          <span className="text-sm font-medium">銘柄一覧</span>
          <Badge variant="outline">
            {isLoading ? '読み込み中...' : `${filteredSymbols.length}件`}
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2">
              {filteredSymbols.length === 0 ? (
                <div className="col-span-2 p-4 text-center text-muted-foreground">
                  該当する銘柄がありません
                </div>
              ) : (
                filteredSymbols.map((symbol) => {
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
                        <span className="font-medium">{symbol.baseAsset}</span>
                        <span className="text-muted-foreground text-xs ml-1">/{symbol.quoteAsset}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{symbol.symbol}</span>
                    </div>
                    <div
                      className="inline-flex items-center justify-center h-6 w-6 ml-1 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(symbol.symbol);
                      }}
                    >
                      {symbol.isFavorite ? (
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
    </div>
  );
}
