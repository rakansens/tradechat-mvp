/**
 * components/chart/core/useChartCore.ts
 * チャートコアの初期化と管理を担当するHook
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { 
  IChartApi, 
  ISeriesApi, 
  createChart, 
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  UTCTimestamp
} from 'lightweight-charts';
import { OHLCData, Timeframe } from '@/types/chart';
import { ChartType, ExtendedChartType } from '@/types/constants/enums';
import { logger } from '@/utils/common';

// utils/chart からユーティリティ関数をインポート
import { 
  debounce, 
  removeDuplicateTimeEntries,
  normalizeTimeValue,
  ensureMilliseconds
} from '@/utils/chart/transformers';

import { 
  sanitizeOHLCData 
} from '@/utils/chart/sanitizers';

import {
  formatCandlestickData,
  formatLineData
} from '@/utils/chart/formatters';

// チャートのシリーズ参照
export interface ChartSeriesRefs {
  candleSeries: React.MutableRefObject<ISeriesApi<"Candlestick"> | null>;
  lineSeries: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  areaSeries: React.MutableRefObject<ISeriesApi<"Area"> | null>;
}

// フックの戻り値の型定義
export interface UseChartCoreReturn {
  chartRef: React.RefObject<HTMLDivElement>;
  chartInstanceRef: React.RefObject<IChartApi | null>;
  seriesRefs: ChartSeriesRefs;
  resizeChart: () => void;
  updateChartData: (data: OHLCData[], chartType: ExtendedChartType) => void;
}

/**
 * useChartCoreフック
 * 
 * チャートのコア機能を提供するカスタムフック
 * レンダリング、リサイズ、データ更新などを処理
 * 
 * @returns チャート操作用のオブジェクト
 */
export function useChartCore(): UseChartCoreReturn {
  // DOM参照
  const chartRef = useRef<HTMLDivElement>(null);
  
  // チャートインスタンス参照
  const chartInstanceRef = useRef<IChartApi | null>(null);
  
  // シリーズの参照
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const areaSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // 最後のリサイズ寸法を保持
  const lastDimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  
  // チャートのリサイズ処理
  const resizeChart = useCallback(() => {
    if (!chartRef.current || !chartInstanceRef.current) return;
    
    const { width, height } = chartRef.current.getBoundingClientRect();
    
    // 以前と同じサイズの場合はスキップ
    if (width === lastDimensionsRef.current.width && height === lastDimensionsRef.current.height) {
      return;
    }
    
    try {
      chartInstanceRef.current.resize(width, height);
      lastDimensionsRef.current = { width, height };
      
      logger.debug('チャートをリサイズしました', {
        component: 'useChartCore',
        action: 'resizeChart',
        width,
        height
      });
    } catch (error) {
      logger.error('チャートのリサイズに失敗しました', {
        component: 'useChartCore',
        action: 'resizeChart',
        error
      });
    }
  }, []);
  
  // チャートデータの更新
  const updateChartData = useCallback((data: OHLCData[], chartType: ExtendedChartType) => {
    if (!chartInstanceRef.current) return;
    if (!data || data.length === 0) return;
    
    try {
      // データの正規化・検証
      const sanitizedData = sanitizeOHLCData(data);
      
      // チャートタイプの正規化（互換性対応）
      const normalizedChartType = 
        chartType === 'candlestick' ? 'candles' :
        chartType === 'bar' ? 'bars' :
        chartType;
      
      // シリーズタイプに応じたデータ更新
      if ((normalizedChartType === 'candles') && candleSeries.current) {
        const formattedData = formatCandlestickData(sanitizedData);
        candleSeries.current.setData(formattedData);
      } else if (normalizedChartType === 'line' && lineSeries.current) {
        const formattedData = formatLineData(sanitizedData);
        lineSeries.current.setData(formattedData);
      } else if (normalizedChartType === 'area' && areaSeries.current) {
        const formattedData = formatLineData(sanitizedData);
        areaSeries.current.setData(formattedData);
      } else if (normalizedChartType === 'bars' && candleSeries.current) {
        // barsはローソク足シリーズで表示する
        const formattedData = formatCandlestickData(sanitizedData);
        candleSeries.current.setData(formattedData);
      }
      
      // タイムスケールをフィット
      chartInstanceRef.current.timeScale().fitContent();
      
    } catch (error) {
      logger.error('チャートデータの更新に失敗しました', {
        component: 'useChartCore',
        action: 'updateChartData',
        error
      });
    }
  }, []);
  
  // リサイズ検出用のResizeObserver設定
  useEffect(() => {
    if (!chartRef.current) return;
    
    // サイズ変更処理をdebounce
    const handleResize = debounce((entries: ResizeObserverEntry[]) => {
      if (!chartInstanceRef.current || entries.length === 0) return;

      const entry = entries[0];
      const { width, height } = entry.contentRect;

      // 以前の寸法と比較して変更がある場合のみresizeを実行
      // 最小の変化（1px以上）がある場合のみresize実行（微小変化によるループを防止）
      if (
        Math.abs(width - lastDimensionsRef.current.width) > 1 ||
        Math.abs(height - lastDimensionsRef.current.height) > 1
      ) {
        lastDimensionsRef.current = { width, height };
        try {
          chartInstanceRef.current.resize(width, height);
        } catch (err) {
          logger.error('ResizeObserverによるchart.resize中にエラーが発生しました', err, {
            component: 'useChartCore',
            action: 'resizeObserver'
          });
        }
      }
    }, 100); // 100ms debounce
    
    // ResizeObserverを使用してコンテナリサイズを監視
    const resizeObserver = new ResizeObserver(handleResize);
    
    // 監視開始
    resizeObserver.observe(chartRef.current);
    
    // クリーンアップ
    return () => {
      if (chartRef.current) {
        resizeObserver.unobserve(chartRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);
  
  // チャートインスタンスの初期化
  useEffect(() => {
    if (!chartRef.current) return;
    
    // チャートコンテナのサイズを取得
    const container = chartRef.current;
    const { width, height } = container.getBoundingClientRect();
    lastDimensionsRef.current = { width, height };
    
    // チャートインスタンスの作成
    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#151924" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "#1F2937" },
        horzLines: { color: "#1F2937" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1F2937",
      },
      rightPriceScale: {
        borderColor: "#1F2937",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        entireTextOnly: false,
        visible: true,
        autoScale: true,
      },
      crosshair: {
        mode: 0,
      },
    });
    
    // チャートインスタンスを保存
    chartInstanceRef.current = chart;
    
    // デフォルトシリーズ（使用時に切り替え）
    candleSeries.current = chart.addSeries(CandlestickSeries, {
      upColor: "#26A69A",
      downColor: "#EF5350",
      borderVisible: false,
      wickUpColor: "#26A69A",
      wickDownColor: "#EF5350",
    });
    
    // シリーズは初期状態では非表示
    chart.removeSeries(candleSeries.current);
    candleSeries.current = null;
    
    logger.info('チャートコアを初期化しました', {
      component: 'useChartCore',
      action: 'initChart',
      width,
      height
    });
    
    // クリーンアップ関数
    return () => {
      // チャートを削除
      chart.remove();
      chartInstanceRef.current = null;
      
      // シリーズをリセット
      candleSeries.current = null;
      lineSeries.current = null;
      areaSeries.current = null;
      
      logger.info('チャートコアをクリーンアップしました', {
        component: 'useChartCore',
        action: 'cleanup'
      });
    };
  }, []);
  
  // 初期化後のシリーズ設定
  const initSeries = useCallback((chartType: ChartType) => {
    if (!chartInstanceRef.current) return;
    const chart = chartInstanceRef.current;
    
    // 既存シリーズをクリア
    if (candleSeries.current) {
      chart.removeSeries(candleSeries.current);
      candleSeries.current = null;
    }
    if (lineSeries.current) {
      chart.removeSeries(lineSeries.current);
      lineSeries.current = null;
    }
    if (areaSeries.current) {
      chart.removeSeries(areaSeries.current);
      areaSeries.current = null;
    }
    
    // チャートタイプに応じたシリーズを作成
    if (chartType === 'candles') {
      candleSeries.current = chart.addSeries(CandlestickSeries, {
        upColor: "#26A69A",
        downColor: "#EF5350",
        borderVisible: false,
        wickUpColor: "#26A69A",
        wickDownColor: "#EF5350",
      });
    } else if (chartType === 'line') {
      lineSeries.current = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
      });
    } else if (chartType === 'area') {
      areaSeries.current = chart.addSeries(AreaSeries, {
        topColor: "rgba(41, 98, 255, 0.56)",
        bottomColor: "rgba(41, 98, 255, 0.04)",
        lineColor: "rgba(41, 98, 255, 1)",
        lineWidth: 2,
      });
    }
    
    logger.info(`シリーズを初期化しました: ${chartType}`, {
      component: 'useChartCore',
      action: 'initSeries',
      chartType
    });
  }, []);
  
  return {
    chartRef: chartRef as React.RefObject<HTMLDivElement>,
    chartInstanceRef,
    seriesRefs: {
      candleSeries,
      lineSeries,
      areaSeries
    },
    resizeChart,
    updateChartData
  };
} 