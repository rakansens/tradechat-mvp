"use client"

// components/chart/toolbar/ui/TimeframeButtons.tsx
// 作成: 時間足選択ボタン列を表示するコンポーネント
// 役割:
// 1. 利用可能な時間足の一覧表示
// 2. 現在選択中の時間足のハイライト表示
// 3. 時間足選択時のコールバック処理

import React, { memo } from 'react';
import { Timeframe } from '@/types/chart';

interface TimeframeButtonsProps {
  // 利用可能な時間足の配列
  availableTimeframes: string[];
  // 現在選択中の時間足
  currentTimeFrame: Timeframe;
  // 時間足変更時のコールバック
  onTimeframeChange: (timeframe: Timeframe) => void;
}

/**
 * 時間足選択ボタンコンポーネント
 */
const TimeframeButtons = memo(function TimeframeButtons({
  availableTimeframes,
  currentTimeFrame,
  onTimeframeChange
}: TimeframeButtonsProps) {
  return (
    <div className="flex items-center space-x-1" role="group">
      {availableTimeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => {
            console.log(`タイムフレーム変更: ${tf}`);
            onTimeframeChange(tf as Timeframe);
          }}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent px-2 py-1 h-7 text-[#A7B0C4] data-[state=on]:bg-[#2962FF] data-[state=on]:text-white border-[#2A2E39] hover:bg-[#242838] ${
            currentTimeFrame === tf ? 'bg-[#2962FF] text-white' : ''
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
});

export default TimeframeButtons; 