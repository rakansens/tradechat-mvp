"use client"

// components/chart/toolbar/ui/RealtimeToggle.tsx
// 作成: リアルタイム更新のオン/オフを切り替えるボタンコンポーネント
// 役割:
// 1. リアルタイム状態の表示
// 2. オン/オフ切り替え時のコールバック

import React, { memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeToggleProps {
  // リアルタイム更新の状態
  useRealTimeData: boolean;
  // 状態切り替え時のコールバック
  toggleRealTimeData: () => void;
}

/**
 * リアルタイム更新のオン/オフを切り替えるボタンコンポーネント
 */
const RealtimeToggle = memo(function RealtimeToggle({
  useRealTimeData,
  toggleRealTimeData
}: RealtimeToggleProps) {
  return (
    <button
      onClick={toggleRealTimeData}
      className="flex items-center px-2 py-1 text-xs rounded bg-dark-800 text-gray-300 hover:bg-dark-700"
      title={useRealTimeData ? "リアルタイム更新を停止" : "リアルタイム更新を開始"}
    >
      {useRealTimeData ? (
        <>
          <Wifi className="w-3.5 h-3.5 mr-1 text-green-500" />
          <span>リアルタイム</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 mr-1 text-gray-500" />
          <span>リアルタイム</span>
        </>
      )}
    </button>
  );
});

export default RealtimeToggle; 