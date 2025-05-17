/**
 * components/symbol/Selector/ui/ExchangeTabs.tsx
 * 取引タイプを選択するタブコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 * - 2025-05-14: onExchangeTypeChangeの型をExchangeTypeに修正
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProductType } from '@/types/constants/enums';

interface ExchangeTabsProps {
  currentProductType: ProductType;
  onProductTypeChange: (value: ProductType) => void;
}

/**
 * 取引タイプ選択タブ（現物/先物）
 */
export const ExchangeTabs = ({
  currentProductType,
  onProductTypeChange
}: ExchangeTabsProps) => {
  const handleValueChange = (value: string) => {
    // 型安全に処理
    if (value === 'spot' || value === 'futures') {
      onProductTypeChange(value);
    }
  };

  return (
    <Tabs defaultValue={currentProductType} onValueChange={handleValueChange}>
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="spot">現物</TabsTrigger>
        <TabsTrigger value="futures">先物</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ExchangeTabs; 