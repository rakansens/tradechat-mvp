/**
 * components/chart/container/ChartBody.tsx
 * チャートコンテナの本体部分
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 * - 2025-06-05: T-7.5フェーズ - 型インポートパスを修正
 */

"use client";

import React from 'react';
import type { OHLCData } from '@/types/chart';
import type { ExchangeType } from '@/types/api';
import type { Timeframe, ChartType } from '@/types/chart';
import type { ActiveIndicator } from '@/types/store/chart';

interface ChartBodyProps {
  // 表示データ
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  chartType: ChartType;
  exchangeType: ExchangeType;
  chartData: OHLCData[] | null;
  activeIndicators: ActiveIndicator[];
  activeDrawingTools: string[];
}

/**
 * チャート本体コンポーネント
 * 
 * 実際のチャートまたはプレースホルダーを表示します。
 * 将来的にはここにChartCanvasコンポーネントを配置します。
 */
export const ChartBody: React.FC<ChartBodyProps> = ({
  currentSymbol,
  currentTimeFrame,
  chartType,
  exchangeType,
  chartData,
  activeIndicators,
  activeDrawingTools
}) => {
  return (
    <div className="chart-body">
      {/* ここに実際のチャートを描画するコンポーネントを配置 */}
      <div className="chart-placeholder">
        <p>Chart for {currentSymbol} ({currentTimeFrame})</p>
        <p>Chart Type: {chartType}</p>
        <p>Exchange Type: {exchangeType}</p>
        <p>Data Points: {chartData ? chartData.length : 0}</p>
        <p>
          Active Indicators: 
          {activeIndicators.length === 0 
            ? ' None' 
            : ` ${activeIndicators.map(ind => ind.type).join(', ')}`
          }
        </p>
        <p>
          Active Drawing Tools: 
          {activeDrawingTools.length === 0 
            ? ' None' 
            : ` ${activeDrawingTools.join(', ')}`
          }
        </p>
      </div>
    </div>
  );
}; 