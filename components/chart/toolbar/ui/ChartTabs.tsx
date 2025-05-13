"use client"

// components/chart/toolbar/ui/ChartTabs.tsx
// 作成: チャートとポジション間のタブ切り替えを行うコンポーネント
// 役割:
// 1. チャート/ポジションタブの表示
// 2. タブ切り替え時のコールバック処理
// 3. ポジション数バッジの表示

import React, { memo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, LineChart } from 'lucide-react';

interface ChartTabsProps {
  // 現在アクティブなタブ
  activeTab?: string;
  // タブ変更時のコールバック
  onTabChange?: (tab: string) => void;
  // オープンポジションの数
  openPositionsCount: number;
}

/**
 * チャートとポジションを切り替えるタブコンポーネント
 */
const ChartTabs = memo(function ChartTabs({
  activeTab,
  onTabChange,
  openPositionsCount
}: ChartTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange && onTabChange(value)}
      className="h-7"
    >
      <TabsList className="h-7 bg-[#242838] border border-[#2A2E39]">
        <TabsTrigger
          value="chart"
          className="flex items-center h-6 px-2 text-xs data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-[#E0E3EB]"
        >
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          Chart
        </TabsTrigger>
        <TabsTrigger
          value="positions"
          className="flex items-center relative h-6 px-2 text-xs data-[state=active]:bg-[#2a2e39] data-[state=active]:text-[#b2b5be]"
        >
          <LineChart className="h-3.5 w-3.5 mr-1" />
          Positions
          {openPositionsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-[#2196f3]">
              {openPositionsCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
});

export default ChartTabs; 