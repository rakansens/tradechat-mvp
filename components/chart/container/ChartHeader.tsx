/**
 * components/chart/container/ChartHeader.tsx
 * チャートコンテナのヘッダー部分
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 */

"use client";

import React from 'react';
import type { ExchangeType, ProductType } from '@/types/constants/enums';
import type { Timeframe, ChartType } from '@/types/chart';

interface ChartHeaderProps {
  // 表示データ
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  chartType: ChartType;
  exchangeType: ExchangeType; // 取引所タイプ
  productType?: ProductType; // 取引種別(現物/先物)
  useRealTimeData: boolean;
  
  // イベントハンドラ
  handleTimeFrameChange: (newTimeFrame: Timeframe) => void;
  handleChartTypeChange: (newType: ChartType) => void;
  handleExchangeTypeChange: (newType: ProductType) => void;
  handleToggleRealTimeData: () => void;
}

/**
 * チャートヘッダーコンポーネント
 * 
 * タイムフレーム、チャートタイプ、取引種別、リアルタイムデータの切り替えなどのコントロールを提供します。
 */
export const ChartHeader: React.FC<ChartHeaderProps> = ({
  currentSymbol,
  currentTimeFrame,
  chartType,
  exchangeType,
  productType = 'spot', // デフォルト値を設定
  useRealTimeData,
  handleTimeFrameChange,
  handleChartTypeChange,
  handleExchangeTypeChange,
  handleToggleRealTimeData
}) => {
  return (
    <div className="chart-header">
      <h2>{currentSymbol} - {currentTimeFrame}</h2>
      
      <div className="chart-controls">
        {/* タイムフレーム選択 */}
        <div className="timeframe-selector">
          <button 
            className={currentTimeFrame === '1m' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('1m')}
          >
            1m
          </button>
          <button 
            className={currentTimeFrame === '5m' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('5m')}
          >
            5m
          </button>
          <button 
            className={currentTimeFrame === '15m' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('15m')}
          >
            15m
          </button>
          <button 
            className={currentTimeFrame === '1h' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('1h')}
          >
            1h
          </button>
          <button 
            className={currentTimeFrame === '4h' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('4h')}
          >
            4h
          </button>
          <button 
            className={currentTimeFrame === '1d' ? 'active' : ''} 
            onClick={() => handleTimeFrameChange('1d')}
          >
            1d
          </button>
        </div>
        
        {/* チャートタイプ選択 */}
        <div className="chart-type-selector">
          <button 
            className={chartType === 'candles' ? 'active' : ''} 
            onClick={() => handleChartTypeChange('candles')}
          >
            Candles
          </button>
          <button 
            className={chartType === 'line' ? 'active' : ''} 
            onClick={() => handleChartTypeChange('line')}
          >
            Line
          </button>
          <button 
            className={chartType === 'area' ? 'active' : ''} 
            onClick={() => handleChartTypeChange('area')}
          >
            Area
          </button>
          <button 
            className={chartType === 'bars' ? 'active' : ''} 
            onClick={() => handleChartTypeChange('bars')}
          >
            Bar
          </button>
        </div>
        
        {/* 取引種別選択 */}
        <div className="product-type-selector">
          <button 
            className={(productType || 'spot') === 'spot' ? 'active' : ''} 
            onClick={() => handleExchangeTypeChange('spot' as ProductType)}
          >
            Spot
          </button>
          <button 
            className={(productType || 'spot') === 'futures' ? 'active' : ''} 
            onClick={() => handleExchangeTypeChange('futures' as ProductType)}
          >
            Futures
          </button>
        </div>
        
        {/* リアルタイムデータ切り替え */}
        <div className="realtime-toggle">
          <button 
            className={useRealTimeData ? 'active' : ''} 
            onClick={handleToggleRealTimeData}
          >
            {useRealTimeData ? 'Real-time: ON' : 'Real-time: OFF'}
          </button>
        </div>
      </div>
    </div>
  );
}; 