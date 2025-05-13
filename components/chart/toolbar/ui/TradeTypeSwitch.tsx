"use client"

// components/chart/toolbar/ui/TradeTypeSwitch.tsx
// 作成: 現物/先物取引の切り替えボタンコンポーネント
// 役割:
// 1. 現物/先物切り替えUIの表示
// 2. 現在選択中の取引種別のハイライト
// 3. 取引種別変更時のコールバック

import React, { memo } from 'react';
import { ExchangeType } from '@/types/api';

interface TradeTypeSwitchProps {
  // 現在選択中の取引種別
  exchangeType: ExchangeType;
  // 取引種別変更時のコールバック
  onExchangeTypeChange: (type: ExchangeType) => void;
  // データ再取得のコールバック
  fetchChartData: (symbol: string, timeFrame: string) => void;
  // 現在の銘柄と時間足
  currentSymbol: string;
  currentTimeFrame: string;
  // クライアントサイドレンダリング用
  isClient: boolean;
}

/**
 * 現物/先物取引の切り替えボタンコンポーネント
 */
const TradeTypeSwitch = memo(function TradeTypeSwitch({
  exchangeType,
  onExchangeTypeChange,
  fetchChartData,
  currentSymbol,
  currentTimeFrame,
  isClient
}: TradeTypeSwitchProps) {
  return (
    <div className="flex items-center">
      <button
        onClick={() => {
          // 取引種別を更新
          onExchangeTypeChange('spot');
          // データを再取得
          if (typeof fetchChartData === 'function') {
            fetchChartData(currentSymbol, currentTimeFrame);
          } else {
            console.error('fetchChartData is not a function', fetchChartData);
          }
        }}
        className={`flex items-center px-2 py-1 text-xs rounded-l ${
          !isClient ? 'bg-dark-800 text-gray-300' : // 初期レンダリング時はデフォルトスタイル
          exchangeType === 'spot'
            ? 'bg-blue-600 text-white'
            : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
        }`}
      >
        現物
      </button>
      <button
        onClick={() => {
          // 取引種別を更新
          onExchangeTypeChange('futures');
          // データを再取得
          if (typeof fetchChartData === 'function') {
            fetchChartData(currentSymbol, currentTimeFrame);
          } else {
            console.error('fetchChartData is not a function', fetchChartData);
          }
        }}
        className={`flex items-center px-2 py-1 text-xs rounded-r ${
          !isClient ? 'bg-dark-800 text-gray-300' : // 初期レンダリング時はデフォルトスタイル
          exchangeType === 'futures'
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