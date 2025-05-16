/**
 * components/symbol/ExchangeSelector.tsx
 * 取引所タイプセレクターコンポーネント
 * spot/futuresを選択するためのシンプルなセレクタコンポーネント
 */

"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ExchangeType } from '@/types/network/api';

export interface ExchangeSelectorProps {
  exchangeType: ExchangeType;
  onChange: (type: ExchangeType) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 取引所タイプセレクターコンポーネント
 * 現物(spot)と先物(futures)を切り替えるUI
 */
export const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  exchangeType,
  onChange,
  disabled = false,
  className = '',
}) => {
  const handleSpotClick = useCallback(() => {
    if (exchangeType !== 'spot') {
      onChange('spot');
    }
  }, [exchangeType, onChange]);

  const handleFuturesClick = useCallback(() => {
    if (exchangeType !== 'futures') {
      onChange('futures');
    }
  }, [exchangeType, onChange]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Button
        variant={exchangeType === 'spot' ? 'default' : 'outline'}
        size="sm"
        onClick={handleSpotClick}
        disabled={disabled}
        className="px-3 py-1 h-7"
      >
        現物
      </Button>
      <Button
        variant={exchangeType === 'futures' ? 'default' : 'outline'}
        size="sm"
        onClick={handleFuturesClick}
        disabled={disabled}
        className="px-3 py-1 h-7"
      >
        先物
      </Button>
    </div>
  );
};

export default ExchangeSelector; 