"use client"

// components/chart/toolbar/ui/TradeTypeSwitch.tsx
// 作成: 取引タイプ（現物・先物）を切り替えるトグルスイッチコンポーネント
// 役割:
// 1. 取引タイプのトグルスイッチ表示
// 2. 現在の取引タイプのハイライト
// 3. タイプ変更時のコールバック

import React, { memo } from 'react';
import type { ExchangeProductType } from '@/types/constants/enums';

interface TradeTypeSwitchProps {
  // 現在選択中の取引タイプ
  productType: ExchangeProductType;
  // 取引タイプ変更時のコールバック
  onProductTypeChange: (type: ExchangeProductType) => void;
  // 無効状態
  disabled?: boolean;
}

/**
 * 現物/先物取引の切り替えボタンコンポーネント
 */
const TradeTypeSwitch = memo(function TradeTypeSwitch({
  productType,
  onProductTypeChange,
  disabled = false,
}: TradeTypeSwitchProps) {
  return (
    <div className="flex items-center">
      <button
        onClick={() => onProductTypeChange('spot')}
        disabled={disabled}
        className={`flex items-center px-2 py-1 text-xs rounded-l ${
          productType === 'spot'
            ? 'bg-blue-600 text-white'
            : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
        }`}
      >
        現物
      </button>
      <button
        onClick={() => onProductTypeChange('futures')}
        disabled={disabled}
        className={`flex items-center px-2 py-1 text-xs rounded-r ${
          productType === 'futures'
            ? 'bg-blue-600 text-white'
            : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
        }`}
      >
        先物
      </button>
    </div>
  );
});

export default TradeTypeSwitch; 