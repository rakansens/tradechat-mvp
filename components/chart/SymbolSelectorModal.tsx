'use client';

// components/chart/SymbolSelectorModal.tsx
// 作成: 銘柄選択モーダルコンポーネント
// 更新: ハイドレーションエラーの修正
// 更新: 2025-10-09 - S-9.2フェーズ: ExchangeType型の参照を統一し型変換を追加

import { useState, useEffect } from 'react';
import { type ProductType } from '@/types/constants/enums';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SymbolSelector from '@/components/SymbolSelector';
import { CandlestickChart } from 'lucide-react';
import { safeProductType } from '@/utils/exchangeTypeUtils';

interface SymbolSelectorModalProps {
  currentSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  productType?: ProductType;
  onProductTypeChange?: (productType: ProductType) => void;
  trigger?: React.ReactNode;
}

export default function SymbolSelectorModal({
  currentSymbol,
  onSymbolSelect,
  productType = 'spot',
  onProductTypeChange,
  trigger
}: SymbolSelectorModalProps) {
  const [open, setOpen] = useState(false);
  // クライアントサイドでのみシンボルを表示するための状態
  const [mounted, setMounted] = useState(false);
  
  // クライアントサイドでのみ実行される処理
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSymbolSelect = (symbol: string) => {
    onSymbolSelect(symbol);
    setOpen(false);
  };
  
  // 型安全な取引タイプ変更ハンドラ
  const handleProductTypeChange = onProductTypeChange
    ? (newType: any) => {
        // 型変換して親コンポーネントに渡す
        onProductTypeChange(safeProductType(newType));
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1">
            <CandlestickChart className="h-4 w-4" />
            <span>{mounted ? currentSymbol : ''}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>銘柄選択</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">
          <SymbolSelector
            onSelect={handleSymbolSelect}
            currentSymbol={currentSymbol}
            defaultProductType={safeProductType(productType)}
            onProductTypeChange={handleProductTypeChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
