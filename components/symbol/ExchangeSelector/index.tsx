// components/symbol/ExchangeSelector/index.tsx
// 作成: 2025-10-X - ExchangeSelectorスタブコンポーネント
// 役割: シンボル選択時の取引所選択UI

import React from 'react';
import { ExchangeType } from '@/types/constants/enums';

interface ExchangeSelectorProps {
  currentExchange: ExchangeType;
  onExchangeChange: (exchangeType: ExchangeType) => void;
}

/**
 * 取引所選択コンポーネント（スタブ実装）
 */
const ExchangeSelector: React.FC<ExchangeSelectorProps> = ({
  currentExchange,
  onExchangeChange
}) => {
  return (
    <div className="exchange-selector">
      <select
        value={currentExchange}
        onChange={(e) => onExchangeChange(e.target.value as ExchangeType)}
        className="form-select"
      >
        <option value="bitget">Bitget</option>
        <option value="binance">Binance</option>
        <option value="bybit">Bybit</option>
      </select>
    </div>
  );
};

export default ExchangeSelector; 