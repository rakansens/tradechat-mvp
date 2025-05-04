// components/chart/ChartCanvas.tsx
// 更新: 共通インターフェースを使用するように修正
"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type {
  IChartApi,
  ISeriesApi,
  LineStyle,
  UTCTimestamp,
  // Core types
  Time,
  CandlestickData,
  LineData,
  BarData,
  WhitespaceData,
  SeriesMarker,
  // Options and Config types
  CandlestickSeriesOptions,
  DeepPartial,
} from "lightweight-charts"
// v5.0.6のAPIを使用するようにインポートを修正
import { createChart, ColorType } from "lightweight-charts";
import { CandlestickSeries, LineSeries, AreaSeries } from "lightweight-charts";
import type { Entry, ClosedEntry } from "@/types/entry"
import type { Timeframe, ChartType, OHLCData } from "@/types/chart"
import type { ChartViewProps, TimeframeControlProps, ChartTypeControlProps } from "@/types/common-interfaces"
import { theme } from "@/styles/colors"
import { useChartConfig } from "@/hooks/useChartConfig"
import { useTheme } from "next-themes"
import { RSI } from './indicators/rsi'; // Import RSI functions
import { logger } from '@/utils/logger'; // Import logger
import { MACD, MacdSeriesRefs } from "./indicators/macd"; // Import MACD functions
import {
  calculateIchimokuData,
  addOrUpdateIchimokuSeries,
  removeIchimokuSeries
} from "./indicators/ichimoku"; // Import Ichimoku functions
import {
  calculateFibonacciLevels,
  drawFibonacciRetracement,
  removeFibonacciRetracement,
  FibonacciLineHandles
} from "./drawing-tools/fibonacci"; // Import Fibonacci functions
import { RSI as RsiIndicator } from 'technicalindicators'; // Import directly for calculation
// 分割されたストアとセレクターをインポート
import { 
  useChartDataStore,
  useChartConfigStore,
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore,
  // メモ化されたセレクター
  selectCurrentPrice,
  selectHighPrice,
  selectLowPrice,
  selectRSI,
  selectMACD,
  selectSMA
} from "../../store";
// v5.0.6では既にColorTypeがインポートされているため、ここでは不要

// 共通インターフェースを使用して型定義を整理
interface ChartCanvasProps {
  data: OHLCData[]
  entries?: Entry[]
  timeframe: TimeframeControlProps["timeframe"]
  chartType: ChartType
}

// Helper function to convert HSL CSS variable string to RGBA
// Ensures it runs only on the client-side where document is available
const hslCssVarToRgba = (hslVarValue: string, fallbackColor: string): string => {
  if (typeof document === 'undefined' || !hslVarValue) {
    return fallbackColor; // Return fallback if not in browser or value is empty
  }
  try {
    const el = document.createElement('div');
    // IMPORTANT: Set style directly to hsl() format CSS expects
    el.style.color = `hsl(${hslVarValue})`;
    document.body.appendChild(el); // Needs to be in the DOM to compute style
    const rgbaColor = window.getComputedStyle(el).color;
    document.body.removeChild(el);

    // lightweight-charts accepts rgb/rgba strings
    if (rgbaColor && rgbaColor.startsWith('rgb')) {
      return rgbaColor;
    }
    logger.warn(`Failed to convert HSL value 'hsl(${hslVarValue})' to RGBA/RGB. Computed value: ${rgbaColor}. Using fallback: ${fallbackColor}`, {
      component: 'ChartCanvas',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor;
  } catch (error) {
    logger.error(`Error converting HSL value 'hsl(${hslVarValue})'`, error, {
      component: 'ChartCanvas',
      action: 'hslCssVarToRgba'
    });
    return fallbackColor; // Return fallback on error
  }
};

export default function ChartCanvas() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const areaSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // インジケーターのシリーズ参照
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeries = useRef<MacdSeriesRefs>({ 
    macdLine: { current: null },
    signalLine: { current: null },
    histogram: { current: null }
  });
  
  // 一目均衡表のシリーズ参照
  const tenkanSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const kijunSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const chikouSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const cloudSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // フィボナッチリトレースメントのライン参照
  const [fibonacciLines, setFibonacciLines] = useState<FibonacciLineHandles>({});
  
  // 分割されたチャートストアから状態を取得
  // データ関連の状態とアクション
  const { 
    data, 
    currentSymbol, 
    currentTimeFrame
  } = useChartDataStore();
  
  // 設定関連の状態
  const { 
    chartType 
  } = useChartConfigStore();
  
  // インジケーター関連の状態
  const { 
    activeIndicators 
  } = useIndicatorStore();
  
  // 描画ツール関連の状態
  const { 
    activeDrawingTools 
  } = useDrawingToolStore();

  // メモ化されたセレクターを使用して価格データを取得
  const currentPrice = useChartDataStore(selectCurrentPrice);
  const highPrice = useChartDataStore(selectHighPrice);
  const lowPrice = useChartDataStore(selectLowPrice);
  
  // MACDデータを取得
  const macdData = useChartDataStore(selectMACD());
  
  // SMAデータを取得
  const sma20Data = useChartDataStore(selectSMA(20));
  const sma50Data = useChartDataStore(selectSMA(50));
  
  // RSIデータをトップレベルで取得
  const rsiValues = useChartDataStore(selectRSI(14));
  
  // Hook calls must be at component top-level; remove any nested calls in effects below.

  // チャートのリセット処理
  const resetChartState = () => {
    // インジケーターのシリーズをリセット
    rsiSeries.current = null;
    
    // MACDシリーズのリセット
    if (macdSeries.current) {
      macdSeries.current.macdLine.current = null;
      macdSeries.current.signalLine.current = null;
      macdSeries.current.histogram.current = null;
    }
  };

  // チャートの再描画処理
  const redrawChart = () => {
    if (!chartRef.current || !chartInstanceRef.current) return;
    
    // チャートのサイズを再設定
    chartInstanceRef.current.resize(
      chartRef.current.clientWidth,
      chartRef.current.clientHeight
    );
  };

  // --- Pane management ---
  // Keeps track of next available pane index (0 is main chart)
  const paneCounterRef = useRef<number>(1);
  // Map indicator key -> assigned pane index
  const paneMapRef = useRef<Record<string, number>>({});

  const getPaneIndex = (key: string): number => {
    if (paneMapRef.current[key] !== undefined) return paneMapRef.current[key];
    const idx = paneCounterRef.current++;
    paneMapRef.current[key] = idx;
    return idx;
  };

  // チャートの初期化と更新
  useEffect(() => {
    if (!chartRef.current) return;

    // チャートコンテナのサイズを取得
    const chartContainer = chartRef.current;
    const { width, height } = chartContainer.getBoundingClientRect();

    // チャートインスタンスの作成 - v5.0.6対応
    const chart = createChart(chartContainer, {
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
      },
      crosshair: {
        mode: 0,
      },
    });

    // チャートシリーズの作成 - v5.0.6対応
    if (chartType === "candles") {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      candleSeries.current = chart.addSeries(CandlestickSeries, {
        upColor: "#26A69A",
        downColor: "#EF5350",
        borderVisible: false,
        wickUpColor: "#26A69A",
        wickDownColor: "#EF5350",
      });

      if (data) {
        candleSeries.current.setData(
          data.map((item) => ({
            time: (item.time / 1000) as UTCTimestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))
        );
      }
    } else if (chartType === "line" as ChartType) {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      lineSeries.current = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
      });

      if (data) {
        lineSeries.current.setData(
          data.map((item) => ({
            time: (item.time / 1000) as UTCTimestamp,
            value: item.close,
          }))
        );
      }
    } else if (chartType === "area" as ChartType) {
      // v5ではシリーズタイプを変数として指定する
      // 注意: コンストラクタを渡す必要があります
      areaSeries.current = chart.addSeries(AreaSeries, {
        topColor: "rgba(41, 98, 255, 0.56)",
        bottomColor: "rgba(41, 98, 255, 0.04)",
        lineColor: "rgba(41, 98, 255, 1)",
        lineWidth: 2,
      });

      if (data) {
        areaSeries.current.setData(
          data.map((item) => ({
            time: (item.time / 1000) as UTCTimestamp,
            value: item.close,
          }))
        );
      }
    }

    // チャートインスタンスを保存
    chartInstanceRef.current = chart;

    // クリーンアップ関数
    return () => {
      chart.remove();
      chartInstanceRef.current = null;
      candleSeries.current = null;
      lineSeries.current = null;
      areaSeries.current = null;
      // インジケーター / 補助シリーズもリセットして二重削除を防止
      // インジケーターのシリーズをリセット
      rsiSeries.current = null;
      
      // MACDシリーズのリセット
      if (macdSeries.current) {
        macdSeries.current.macdLine.current = null;
        macdSeries.current.signalLine.current = null;
        macdSeries.current.histogram.current = null;
      }
      if (tenkanSeries.current) tenkanSeries.current = null;
      if (kijunSeries.current) kijunSeries.current = null;
      if (chikouSeries.current) chikouSeries.current = null;
      if (cloudSeries.current) cloudSeries.current = null;
    };
  }, [chartType]);

  // データの更新を監視
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    
    // データを時間順（昇順）にソート
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    
    // データが空でないことを確認
    if (sortedData.length === 0) return;
    
    // データが時間順に並んでいるか検証（デバッグ用）
    for (let i = 1; i < sortedData.length; i++) {
      if (sortedData[i].time < sortedData[i-1].time) {
        logger.warn('データが時間順になっていません', {
          component: 'ChartCanvas',
          action: 'renderChart',
          prevTime: sortedData[i-1].time,
          currentTime: sortedData[i].time
        });
        break;
      }
    }

    if (chartType === "candles" && candleSeries.current) {
      candleSeries.current.setData(
        sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))
      );
    } else if (chartType === "line" as ChartType && lineSeries.current) {
      lineSeries.current.setData(
        sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          value: item.close,
        }))
      );
    } else if (chartType === "area" as ChartType && areaSeries.current) {
      areaSeries.current.setData(
        sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          value: item.close,
        }))
      );
    }
  }, [data, chartType]);

  // ウィンドウサイズの変更を監視
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current && chartInstanceRef.current) {
        const { width, height } = chartRef.current.getBoundingClientRect();
        chartInstanceRef.current.applyOptions({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // インジケーターの表示切替を監視
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    const chart = chartInstanceRef.current;
    const mainSeries = candleSeries.current || lineSeries.current || areaSeries.current;
    if (!mainSeries) return;
    
    // データを時間順（昇順）にソート
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    
    // RSIインジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'rsi')) {
      // RSIパラメータを取得
      const activeRSI = activeIndicators.find(indicator => indicator.type === 'rsi');
      const rsiParams = {
        visible: true,
        period: activeRSI?.params?.period || 14,
        overbought: activeRSI?.params?.overbought || 70,
        oversold: activeRSI?.params?.oversold || 30,
        paneIndex: getPaneIndex('rsi')
      };
      
      // 新しいRSIインターフェースを使用
      RSI.addOrUpdate(chart, sortedData, rsiParams, rsiSeries);
    } else if (rsiSeries.current) {
      // RSIを非表示
      RSI.remove(chart, rsiSeries);
    }
    
    // MACDインジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'macd')) {
      // MACDパラメータを取得
      const activeMacd = activeIndicators.find(indicator => indicator.type === 'macd');
      const macdParams = {
        fastPeriod: activeMacd?.params?.fastPeriod || 12,
        slowPeriod: activeMacd?.params?.slowPeriod || 26,
        signalPeriod: activeMacd?.params?.signalPeriod || 9,
        paneIndex: getPaneIndex('macd'),
        visible: true
      };
      
      // データが十分にあるか確認
      if (sortedData.length >= Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod) {
        logger.info('MACDを表示します', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          dataPoints: sortedData.length
        });
        
        // MACDデータのサンプルをログ出力して確認
        // メモ化されたセレクターを使用してMACDを計算
        const macdSelector = selectMACD(macdParams.fastPeriod, macdParams.slowPeriod, macdParams.signalPeriod);
        const macdValues = macdSelector({ data: sortedData });
        
        logger.debug('MACDデータサンプル', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          macd: macdValues.macd.slice(-5),  // 最後の5データポイント
          signal: macdValues.signal.slice(-5),
          histogram: macdValues.histogram.slice(-5)
        });
        
        // 新しいMACDインターフェースを使用
        try {
          MACD.addOrUpdate(chart, sortedData, macdParams, macdSeries.current);
          logger.debug('MACD表示処理完了', {
            component: 'ChartCanvas',
            action: 'renderMACD'
          });
        } catch (error) {
          logger.error('MACD表示中にエラーが発生しました', error, {
            component: 'ChartCanvas',
            action: 'renderMACD',
            params: macdParams
          });
        }
      } else {
        logger.warn('MACDの計算に必要なデータが不足しています', {
          component: 'ChartCanvas',
          action: 'renderMACD',
          dataPoints: sortedData.length,
          requiredPoints: Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod
        });
      }
    } else if (macdSeries.current) {
      // MACDを非表示
      MACD.remove(chart, macdSeries.current);
      // 保存済み paneMap は残しておく（再表示時に同じ pane を再利用）
    }
    
    // 一目均衡表インジケーターの表示切替
    if (activeIndicators.some(indicator => indicator.type === 'ichimoku')) {
      // 一目均衡表パラメータを取得
      const activeIchimoku = activeIndicators.find(indicator => indicator.type === 'ichimoku');
      
      // 一目均衡表を表示
      addOrUpdateIchimokuSeries(
        chart,
        sortedData,
        {
          tenkan: activeIchimoku?.params?.tenkanPeriod || 9,
          kijun: activeIchimoku?.params?.kijunPeriod || 26,
          senkou: activeIchimoku?.params?.senkouSpanBPeriod || 52
        },
        {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        }
      );
    } else {
      // 一目均衡表を非表示
      if (tenkanSeries.current || kijunSeries.current || chikouSeries.current || cloudSeries.current) {
        removeIchimokuSeries(chart, {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        });
      }
    }
  }, [data, activeIndicators, chartType]);
  
  // 描画ツールの表示切替を監視
  useEffect(() => {
    if (!chartInstanceRef.current || !data || data.length === 0) return;
    
    const chart = chartInstanceRef.current;
    const mainSeries = candleSeries.current || lineSeries.current || areaSeries.current;
    if (!mainSeries) return;
    
    // フィボナッチリトレースメントの表示切替
    if (activeDrawingTools.includes('fibonacci')) {
      // データから高値と安値を取得
      const sortedData = [...data].sort((a, b) => a.time - b.time);
      const last30Data = sortedData.slice(-30); // 直近30本のデータを使用
      
      if (last30Data.length > 0) {
        const highPrice = Math.max(...last30Data.map(d => d.high));
        const lowPrice = Math.min(...last30Data.map(d => d.low));
        
        // 現在のトレンド方向を判断（簡易的な判断）
        const isDowntrend = sortedData[sortedData.length - 1].close < sortedData[sortedData.length - 10].close;
        
        // 既存のフィボナッチラインを削除
        if (Object.keys(fibonacciLines).length > 0) {
          removeFibonacciRetracement(mainSeries, fibonacciLines);
        }
        
        // 新しいフィボナッチラインを描画
        const newLines = drawFibonacciRetracement(
          chart,
          mainSeries,
          highPrice,
          lowPrice,
          isDowntrend ? 'down' : 'up'
        );
        
        setFibonacciLines(newLines);
      }
    } else {
      // フィボナッチを非表示
      if (Object.keys(fibonacciLines).length > 0) {
        removeFibonacciRetracement(mainSeries, fibonacciLines);
        setFibonacciLines({});
      }
    }
  }, [data, activeDrawingTools, chartType]);

  return (
    <div
      ref={chartRef}
      className="w-full h-full bg-dark-800"
      style={{ height: "100%" }}
    />
  );
}

// Get MA period based on timeframe
function getMAPeriodForTimeframe(timeframe: Timeframe): number {
  switch (timeframe) {
    case "1d":
      return 50
    case "4h":
      return 50
    case "1h":
      return 48
    case "15m":
      return 48
    case "5m":
      return 50
    case "1m":
      return 50
    default:
      return 50
  }
}

// Create entry markers
function createEntryMarkers(entries: Entry[]): SeriesMarker<Time>[] {
  return entries.map((entry) => ({
    time: (new Date(entry.time).getTime() / 1000) as UTCTimestamp,
    position: entry.side === "buy" ? "belowBar" : "aboveBar",
    color: entry.side === "buy" ? theme.accent.green : theme.accent.red,
    shape: entry.side === "buy" ? "arrowUp" : "arrowDown",
    text: entry.side === "buy" ? "BUY" : "SELL",
    size: 2,
  }))
}

// 型ガード関数: entryがClosedEntry型かどうかをチェック
function isClosedEntry(entry: Entry): entry is ClosedEntry {
  return entry.status === "closed";
}

// Create exit markers
function createExitMarkers(entries: Entry[]): SeriesMarker<Time>[] {
  return entries
    .filter(isClosedEntry) // 型ガードを使用
    .map((entry) => ({
      time: (new Date(entry.exitTime).getTime() / 1000) as UTCTimestamp,
      position: entry.side === "buy" ? "aboveBar" : "belowBar",
      color: entry.profit > 0 ? theme.accent.green : theme.accent.red,
      shape: "circle",
      text: "EXIT",
      size: 2,
    }))
}
