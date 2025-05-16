"use client"

// components/chart/toolbar/ui/IndicatorPopover.tsx
// 作成: インジケーターと描画ツールの設定を行うポップオーバーコンポーネント
// 役割:
// 1. インジケーター選択UI
// 2. 描画ツール選択UI
// 3. 各ツールの有効/無効切り替え

import React, { memo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LineChart } from 'lucide-react';
import { IndicatorType, DrawingToolType } from '@/types/store/chart';

// インジケーター定義
const indicators = [
  { id: 'rsi', name: 'RSI', icon: LineChart },
  { id: 'macd', name: 'MACD', icon: LineChart },
  { id: 'ichimoku', name: '一目均衡表', icon: LineChart },
];

// 描画ツール定義
const drawingTools = [
  { id: 'fibonacci', name: 'フィボナッチ', icon: LineChart },
  { id: 'rectangle', name: '矩形', icon: LineChart },
];

interface IndicatorPopoverProps {
  // インジケーター関連
  isIndicatorActive: (indicator: IndicatorType) => boolean;
  toggleIndicator: (indicator: IndicatorType) => void;
  
  // 描画ツール関連
  activeDrawingTools: DrawingToolType[];
  toggleDrawingTool: (tool: DrawingToolType) => void;
  clearAllDrawingTools: () => void;
}

/**
 * インジケーターと描画ツールの設定を行うポップオーバーコンポーネント
 */
const IndicatorPopover = memo(function IndicatorPopover({
  isIndicatorActive,
  toggleIndicator,
  activeDrawingTools,
  toggleDrawingTool,
  clearAllDrawingTools
}: IndicatorPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex items-center px-2 py-1 text-xs rounded bg-dark-800 text-gray-300 hover:bg-dark-700"
          title="インジケーター設定"
        >
          <LineChart className="w-3.5 h-3.5 mr-1" />
          <span>インジケーター</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 bg-dark-800 border border-gray-700 text-white">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-300">インジケーター</h3>
          {indicators.map((indicator) => (
            <div key={indicator.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`indicator-${indicator.id}`} 
                checked={isIndicatorActive(indicator.id as IndicatorType)}
                onCheckedChange={() => toggleIndicator(indicator.id as IndicatorType)}
              />
              <Label
                htmlFor={`indicator-${indicator.id}`}
                className="text-xs text-gray-300 cursor-pointer"
              >
                {indicator.name}
              </Label>
            </div>
          ))}

          <h3 className="text-xs font-semibold text-gray-300 pt-2">描画ツール</h3>
          {drawingTools.map((tool) => (
            <div key={tool.id} className="flex items-center space-x-2">
              <Checkbox
                id={`tool-${tool.id}`}
                checked={activeDrawingTools.includes(tool.id as DrawingToolType)}
                onCheckedChange={() => toggleDrawingTool(tool.id as DrawingToolType)}
              />
              <Label
                htmlFor={`tool-${tool.id}`}
                className="text-xs text-gray-300 cursor-pointer"
              >
                {tool.name}
              </Label>
            </div>
          ))}

          <div className="pt-2">
            <button
              onClick={clearAllDrawingTools}
              className="text-xs text-red-400 hover:text-red-300"
            >
              すべての描画をクリア
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default IndicatorPopover; 