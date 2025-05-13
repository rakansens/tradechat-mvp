"use client"

// components/chart/toolbar/ui/ChartTypeSelector.tsx
// 作成: チャートタイプ（ローソク足・ライン・エリア）を切り替えるボタンコンポーネント
// 役割:
// 1. チャートタイプのボタン表示
// 2. 現在選択中のタイプのハイライト
// 3. タイプ変更時のコールバック

import React, { memo } from 'react';
import { ChartType } from '@/types/chart';

interface ChartTypeSelectorProps {
  // 利用可能なチャートタイプの配列
  chartTypes: string[];
  // 現在選択中のチャートタイプ
  currentChartType: ChartType;
  // チャートタイプ変更時のコールバック
  onChartTypeChange: (type: ChartType) => void;
}

/**
 * チャートタイプを切り替えるボタンコンポーネント
 */
const ChartTypeSelector = memo(function ChartTypeSelector({
  chartTypes,
  currentChartType,
  onChartTypeChange
}: ChartTypeSelectorProps) {
  return (
    <div className="flex items-center space-x-1">
      {chartTypes.map((type) => (
        <button
          key={type}
          onClick={() => onChartTypeChange(type as ChartType)}
          className={`px-3 py-1 text-xs rounded ${
            currentChartType === type
              ? 'bg-blue-600 text-white'
              : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  );
});

export default ChartTypeSelector; 