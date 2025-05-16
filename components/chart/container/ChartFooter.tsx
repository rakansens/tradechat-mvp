/**
 * components/chart/container/ChartFooter.tsx
 * チャートコンテナのフッター部分
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 * - 2025-06-05: T-7.5フェーズ - 型インポートパスを修正
 */

"use client";

import React from 'react';
import type { ActiveIndicator, IndicatorType, DrawingToolType } from '@/types/store/chart';

interface ChartFooterProps {
  // 表示データ
  activeIndicators: ActiveIndicator[];
  activeDrawingTools: DrawingToolType[];
  
  // 操作関数
  handleToggleIndicator: (indicator: IndicatorType) => void;
  handleToggleDrawingTool: (tool: DrawingToolType) => void;
  clearAllIndicators: () => void;
  clearAllDrawingTools: () => void;
}

/**
 * チャートフッターコンポーネント
 * 
 * インジケーター、描画ツールの切り替えなどのコントロールを提供します。
 */
export const ChartFooter: React.FC<ChartFooterProps> = ({
  activeIndicators,
  activeDrawingTools,
  handleToggleIndicator,
  handleToggleDrawingTool,
  clearAllIndicators,
  clearAllDrawingTools
}) => {
  return (
    <div className="chart-footer">
      <div className="indicator-controls">
        <h4>Indicators</h4>
        <button 
          className={activeIndicators.some(ind => ind.type === 'rsi') ? 'active' : ''} 
          onClick={() => handleToggleIndicator('rsi')}
        >
          RSI
        </button>
        <button 
          className={activeIndicators.some(ind => ind.type === 'macd') ? 'active' : ''} 
          onClick={() => handleToggleIndicator('macd')}
        >
          MACD
        </button>
        <button 
          className={activeIndicators.some(ind => ind.type === 'ichimoku') ? 'active' : ''} 
          onClick={() => handleToggleIndicator('ichimoku')}
        >
          Ichimoku
        </button>
        <button onClick={clearAllIndicators}>
          Clear All
        </button>
      </div>
      
      <div className="drawing-tool-controls">
        <h4>Drawing Tools</h4>
        <button 
          className={activeDrawingTools.includes('fibonacci') ? 'active' : ''} 
          onClick={() => handleToggleDrawingTool('fibonacci')}
        >
          Fibonacci
        </button>
        <button 
          className={activeDrawingTools.includes('rectangle') ? 'active' : ''} 
          onClick={() => handleToggleDrawingTool('rectangle')}
        >
          Rectangle
        </button>
        <button onClick={clearAllDrawingTools}>
          Clear All
        </button>
      </div>
    </div>
  );
}; 