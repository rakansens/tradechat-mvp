'use client';

// components/chart/SymbolSelectorModal.tsx
// 作成: 銘柄選択モーダルコンポーネント
// 更新: ハイドレーションエラーの修正

import { useState, useEffect } from 'react';
import { ExchangeType } from '@/types/api';
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

interface SymbolSelectorModalProps {
  currentSymbol: string;
  onSymbolSelect: (symbol: string) => void;
  exchangeType?: ExchangeType;
  onExchangeTypeChange?: (exchangeType: ExchangeType) => void;
  trigger?: React.ReactNode;
}

export default function SymbolSelectorModal({
  currentSymbol,
  onSymbolSelect,
  exchangeType = 'spot',
  onExchangeTypeChange,
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
            defaultExchangeType={exchangeType}
            onExchangeTypeChange={onExchangeTypeChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
