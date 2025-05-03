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
import * as LightweightCharts from "lightweight-charts"; // Import the namespace
import type { Entry, ClosedEntry } from "@/types/entry"
import type { Timeframe, ChartType, OHLCData } from "@/types/chart"
import type { ChartViewProps, TimeframeControlProps, ChartTypeControlProps } from "@/types/common-interfaces"
import { theme } from "@/styles/colors"
import { useChartConfig } from "@/hooks/useChartConfig"
import { useTheme } from "next-themes"
import { addOrUpdateRsiSeries } from "./indicators/rsi"; // Import RSI functions
import {
  calculateMacdValues,
  alignMacdData,
  addOrUpdateMacdSeries,
  removeMacdSeries, // Import remove function
  MacdSeriesInstances, // Import the new interface
} from "./indicators/macd"; // Import MACD functions
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
import { useChartStore } from "../../store/useChartStore";
import { createChart, ColorType } from "lightweight-charts";

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
    console.warn(`Failed to convert HSL value 'hsl(${hslVarValue})' to RGBA/RGB. Computed value: ${rgbaColor}. Using fallback: ${fallbackColor}`);
    return fallbackColor;
  } catch (error) {
    console.error(`Error converting HSL value 'hsl(${hslVarValue})':`, error);
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
  const macdSeries = useRef<MacdSeriesInstances | null>(null);
  
  // 一目均衡表のシリーズ参照
  const tenkanSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const kijunSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const chikouSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const cloudSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // フィボナッチリトレースメントのライン参照
  const [fibonacciLines, setFibonacciLines] = useState<FibonacciLineHandles>({});
  
  // チャートストアから状態を取得
  const { 
    data, 
    chartType, 
    currentSymbol, 
    currentTimeFrame,
    initializeChart,
    activeIndicators,
    activeDrawingTools
  } = useChartStore();

  // チャートの初期化と更新
  useEffect(() => {
    if (!chartRef.current) return;

    // 初期チャートデータを取得
    initializeChart(currentSymbol, currentTimeFrame);

    // チャートコンテナのサイズを取得
    const chartContainer = chartRef.current;
    const { width, height } = chartContainer.getBoundingClientRect();

    // チャートインスタンスの作成
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

    // チャートシリーズの作成
    if (chartType === "candles") {
      candleSeries.current = chart.addCandlestickSeries({
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
    } else if (chartType === "line") {
      lineSeries.current = chart.addLineSeries({
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
    } else if (chartType === "area") {
      areaSeries.current = chart.addAreaSeries({
        lineColor: "#2962FF",
        topColor: "rgba(41, 98, 255, 0.28)",
        bottomColor: "rgba(41, 98, 255, 0.05)",
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
        console.warn('データが時間順になっていません:', sortedData[i-1].time, sortedData[i].time);
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
    } else if (chartType === "line" && lineSeries.current) {
      lineSeries.current.setData(
        sortedData.map((item) => ({
          time: (item.time / 1000) as UTCTimestamp,
          value: item.close,
        }))
      );
    } else if (chartType === "area" && areaSeries.current) {
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
    if (activeIndicators.includes('rsi')) {
      // RSIを表示
      const prices = sortedData.map(item => item.close);
      const times = sortedData.map(item => (item.time / 1000) as UTCTimestamp);
      const rsiValues = RsiIndicator.calculate({ values: prices, period: 14 });
      
      // RSIデータを時間と結合
      const rsiData = times.slice(prices.length - rsiValues.length).map((time, i) => ({
        time,
        value: rsiValues[i]
      }));
      
      // パネルインデックスを指定して1を渡す（メインチャートの下に表示）
      addOrUpdateRsiSeries(chart, rsiData, 1, rsiSeries);
    } else if (rsiSeries.current) {
      // RSIを非表示
      chart.removeSeries(rsiSeries.current);
      rsiSeries.current = null;
    }
    
    // MACDインジケーターの表示切替
    if (activeIndicators.includes('macd')) {
      // MACDを表示
      const prices = sortedData.map(item => item.close);
      const times = sortedData.map(item => (item.time / 1000) as UTCTimestamp);
      const macdData = calculateMacdValues(prices, 12, 26, 9); // パラメータを個別に渡す
      
      // 時間データとMACDデータを結合
      const alignedData = alignMacdData(
        sortedData.map(item => ({ 
          time: (item.time / 1000) as UTCTimestamp, 
          close: item.close 
        })),
        macdData
      );
      
      // MACDシリーズの初期化
      if (!macdSeries.current) {
        macdSeries.current = {
          macdLineSeries: null,
          signalLineSeries: null,
          histogramSeries: null
        };
      }
      
      // パネルインデックスを指定して2を渡す（RSIの下に表示）
      if (macdSeries.current) {
        addOrUpdateMacdSeries(chart, alignedData, 2, { current: macdSeries.current });
      }
    } else if (macdSeries.current) {
      // MACDを非表示
      removeMacdSeries(chart, { current: macdSeries.current });
      macdSeries.current = null;
    }
    
    // 一目均衡表インジケーターの表示切替
    if (activeIndicators.includes('ichimoku')) {
      // 一目均衡表を表示
      addOrUpdateIchimokuSeries(
        chart,
        sortedData,
        { tenkan: 9, kijun: 26, senkou: 52 },
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
