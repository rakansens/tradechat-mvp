/**
 * components/chart/drawings/useDrawingTools.ts
 * チャート描画ツールの管理を担当するHook
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 * - 2025-05-30: useDrawingToolStoreをuseRootStoreとセレクターに置き換え
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';
import { logger } from '@/utils/common';
import { useRootStore } from '@/store';
import { selectActiveDrawingTool } from '@/store/chart/drawingTool/selectors';
import {
  FibonacciLineHandles,
  FibonacciOptions
} from '@/components/chart/drawing-tools/fibonacci';
import { getDrawingTool } from '../plugins/drawingToolRegistry';
import type { DrawingToolPlugin } from '../plugins/types';

// 描画ツールのハンドル参照
export interface DrawingToolHandles {
  fibonacciLines: FibonacciLineHandles;
}

// フックの戻り値の型定義
export interface UseDrawingToolsReturn {
  drawingHandles: DrawingToolHandles;
  updateDrawings: (chartInstance: IChartApi, mainSeries: ISeriesApi<any>, data: OHLCData[]) => void;
  clearAllDrawings: (mainSeries: ISeriesApi<any>) => void;
}

/**
 * チャート描画ツール管理フック
 * - 描画ツールのハンドル管理
 * - 描画ツールの表示/非表示切替
 * - 描画ツールの計算と更新
 */
export function useDrawingTools(): UseDrawingToolsReturn {
  // 描画ツールのハンドル
  const [fibonacciLines, setFibonacciLines] = useState<FibonacciLineHandles>({});
  
  // 描画ツールストアから状態を取得
  const activeDrawingTool = useRootStore(selectActiveDrawingTool);
  
  // 描画ツールの更新
  const updateDrawings = useCallback((
    chartInstance: IChartApi, 
    mainSeries: ISeriesApi<any>, 
    data: OHLCData[]
  ) => {
    if (!chartInstance || !mainSeries || !data || data.length === 0) return;
    
    // フィボナッチリトレースメントの表示切替
    if (activeDrawingTool === 'fibonacci') {
      // データから高値と安値を取得
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      const last30Data = sortedData.slice(-30); // 直近30本のデータを使用
      
      if (last30Data.length > 0) {
        const highPrice = Math.max(...last30Data.map(d => Number(d.high)));
        const lowPrice = Math.min(...last30Data.map(d => Number(d.low)));
        
        // 現在のトレンド方向を判断（簡易的な判断）
        const isDowntrend = sortedData[sortedData.length - 1].close < sortedData[Math.max(0, sortedData.length - 10)].close;
        
        const plugin = getDrawingTool<DrawingToolPlugin<FibonacciOptions, FibonacciLineHandles>>('fibonacci');
        if (plugin) {
          if (Object.keys(fibonacciLines).length > 0) {
            plugin.remove(chartInstance, mainSeries, fibonacciLines);
          }
          const newLines = plugin.draw(chartInstance, mainSeries, {
            startPrice: highPrice,
            endPrice: lowPrice,
            direction: isDowntrend ? 'down' : 'up'
          } as FibonacciOptions);

          logger.info('フィボナッチリトレースメントを描画しました', {
            component: 'useDrawingTools',
            action: 'drawFibonacci',
            direction: isDowntrend ? 'down' : 'up',
            highPrice,
            lowPrice
          });

          setFibonacciLines(newLines);
        }
        
        logger.info('フィボナッチリトレースメントを描画しました', {
          component: 'useDrawingTools',
          action: 'drawFibonacci',
          direction: isDowntrend ? 'down' : 'up',
          highPrice,
          lowPrice
        });
        
        setFibonacciLines(newLines);
      }
    } else {
      // フィボナッチを非表示
      const plugin = getDrawingTool<DrawingToolPlugin<FibonacciOptions, FibonacciLineHandles>>('fibonacci');
      if (plugin && Object.keys(fibonacciLines).length > 0) {
        plugin.remove(chartInstance, mainSeries, fibonacciLines);
        setFibonacciLines({});

        logger.info('フィボナッチリトレースメントを削除しました', {
          component: 'useDrawingTools',
          action: 'removeFibonacci'
        });
      }
    }
  }, [activeDrawingTool, fibonacciLines]);
  
  // すべての描画ツールをクリア
  const clearAllDrawings = useCallback((mainSeries: ISeriesApi<any>) => {
    // フィボナッチをクリア
    const plugin = getDrawingTool<DrawingToolPlugin<FibonacciOptions, FibonacciLineHandles>>('fibonacci');
    if (plugin && Object.keys(fibonacciLines).length > 0) {
      plugin.remove(mainSeries.chart as unknown as IChartApi ?? chartInstance, mainSeries, fibonacciLines);
      setFibonacciLines({});
    }
    
    logger.info('すべての描画ツールをクリアしました', {
      component: 'useDrawingTools',
      action: 'clearAllDrawings'
    });
  }, [fibonacciLines]);
  
  // アクティブな描画ツールが変更されたときに自動的にチャートを更新
  useEffect(() => {
    // このHookの中ではチャートインスタンスを持っていないため、
    // 外部からupdateDrawingsを呼び出す必要がある
    logger.debug('描画ツールの状態が変更されました', {
      component: 'useDrawingTools',
      action: 'activeDrawingToolChanged',
      activeTool: activeDrawingTool
    });
  }, [activeDrawingTool]);
  
  return {
    drawingHandles: {
      fibonacciLines
    },
    updateDrawings,
    clearAllDrawings
  };
} 