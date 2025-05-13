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
import { logger } from '@/utils/logger';
import { useRootStore } from '@/store';
import { selectActiveDrawingTools } from '@/store/chart/drawingTool/selectors';
import { 
  FibonacciLineHandles, 
  drawFibonacciRetracement, 
  removeFibonacciRetracement 
} from '@/components/chart/drawing-tools/fibonacci';

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
  const activeDrawingTools = useRootStore(selectActiveDrawingTools);
  
  // 描画ツールの更新
  const updateDrawings = useCallback((
    chartInstance: IChartApi, 
    mainSeries: ISeriesApi<any>, 
    data: OHLCData[]
  ) => {
    if (!chartInstance || !mainSeries || !data || data.length === 0) return;
    
    // フィボナッチリトレースメントの表示切替
    if (activeDrawingTools.includes('fibonacci')) {
      // データから高値と安値を取得
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      const last30Data = sortedData.slice(-30); // 直近30本のデータを使用
      
      if (last30Data.length > 0) {
        const highPrice = Math.max(...last30Data.map(d => Number(d.high)));
        const lowPrice = Math.min(...last30Data.map(d => Number(d.low)));
        
        // 現在のトレンド方向を判断（簡易的な判断）
        const isDowntrend = sortedData[sortedData.length - 1].close < sortedData[Math.max(0, sortedData.length - 10)].close;
        
        // 既存のフィボナッチラインを削除
        if (Object.keys(fibonacciLines).length > 0) {
          removeFibonacciRetracement(mainSeries, fibonacciLines);
        }
        
        // 新しいフィボナッチラインを描画
        const newLines = drawFibonacciRetracement(
          chartInstance,
          mainSeries,
          highPrice,
          lowPrice,
          isDowntrend ? 'down' : 'up'
        );
        
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
      if (Object.keys(fibonacciLines).length > 0) {
        removeFibonacciRetracement(mainSeries, fibonacciLines);
        setFibonacciLines({});
        
        logger.info('フィボナッチリトレースメントを削除しました', {
          component: 'useDrawingTools',
          action: 'removeFibonacci'
        });
      }
    }
  }, [activeDrawingTools, fibonacciLines]);
  
  // すべての描画ツールをクリア
  const clearAllDrawings = useCallback((mainSeries: ISeriesApi<any>) => {
    // フィボナッチをクリア
    if (Object.keys(fibonacciLines).length > 0) {
      removeFibonacciRetracement(mainSeries, fibonacciLines);
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
      action: 'activeDrawingToolsChanged',
      activeTools: activeDrawingTools
    });
  }, [activeDrawingTools]);
  
  return {
    drawingHandles: {
      fibonacciLines
    },
    updateDrawings,
    clearAllDrawings
  };
} 