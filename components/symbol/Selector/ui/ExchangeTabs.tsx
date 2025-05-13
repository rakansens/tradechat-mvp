/**
 * components/symbol/Selector/ui/ExchangeTabs.tsx
 * 取引タイプを選択するタブコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-05: SymbolSelector.tsxのリファクタリングに伴い作成
 */

"use client";

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ExchangeType } from '@/types/api';

interface ExchangeTabsProps {
  currentExchangeType: ExchangeType;
  onExchangeTypeChange: (value: string) => void;
}

/**
 * 取引タイプ選択タブ（現物/先物）
 */
export const ExchangeTabs = ({
  currentExchangeType,
  onExchangeTypeChange
}: ExchangeTabsProps) => {
  return (
    <Tabs defaultValue={currentExchangeType} onValueChange={onExchangeTypeChange}>
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="spot">現物</TabsTrigger>
        <TabsTrigger value="futures">先物</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ExchangeTabs; 