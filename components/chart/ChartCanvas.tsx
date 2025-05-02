// Dynamically imported lightweight-charts and ensured chart initialization runs only on the client-side.
// Added isClient state and modified useEffect hooks accordingly.
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
import type { Entry, Timeframe } from "@/types"
import { useChartConfig } from "@/hooks/useChartConfig"
import { useTheme } from "next-themes"
// import { calculateMaData } from "lib/chartUtils/indicatorUtils"; // MA calculation needs implementation
import { addOrUpdateRsiSeries } from "./indicators/rsi"; // Import RSI functions
import {
  calculateMacdValues,
  alignMacdData,
  addOrUpdateMacdSeries,
  removeMacdSeries, // Import remove function
  MacdSeriesInstances, // Import the new interface
} from "./indicators/macd"; // Import MACD functions
import { RSI as RsiIndicator } from 'technicalindicators'; // Import directly for calculation

interface ChartCanvasProps {
  data: any[]
  entries?: Entry[]
  timeframe: Timeframe
  chartType: "candles" | "line" | "bar"
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

export default function ChartCanvas({ data, entries = [], timeframe, chartType }: ChartCanvasProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time, CandlestickData<Time> | WhitespaceData<Time>, CandlestickSeriesOptions, DeepPartial<CandlestickSeriesOptions>> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const barSeriesRef = useRef<ISeriesApi<"Bar"> | null>(null)
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null) // Ref for RSI series
  // Ref to hold the actual series instances for MACD
  const macdSeriesInstancesRef = useRef<MacdSeriesInstances>({
    macdLineSeries: null,
    signalLineSeries: null,
    histogramSeries: null,
  });
  const markersRef = useRef<any[]>([])
  const { theme } = useTheme()
  const [isClient, setIsClient] = useState(false)
  const [logicalRange, setLogicalRange] = useState<any>(null); // State to hold logical range

  // Helper function to get CSS variable value
  const getCssVar = (name: string): string => {
    if (typeof document === 'undefined') return '' // Guard for SSR
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Get chart configuration
  const { chartOptions, candleSeriesOptions, maSeriesOptions, lineSeriesOptions, barSeriesOptions } = useChartConfig()

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Function to handle crosshair movement
  const handleCrosshairMove = useCallback((param: LightweightCharts.MouseEventParams<Time>) => {
    // TODO: Implement crosshair logic if needed, e.g., update external UI
    // Example: console.log(param.point); // Logs the coordinate
    // Example: console.log(param.time); // Logs the time
    // Example: console.log(param.seriesPrices); // Logs prices for all series at that point
  }, []); // Dependencies should be external values used, not the function itself

  // Function to handle chart resize
  const handleResize = useCallback(() => {
    if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    }
  }, []); // No external dependencies needed for this simple resize

  // Memoized cleanup function
  const cleanupChart = useCallback(() => {
    console.log("Running cleanup...");
    window.removeEventListener("resize", handleResize);

    const currentChart = chartRef.current;
    const currentMacdInstances = macdSeriesInstancesRef.current;

    if (currentChart) {
      console.log("Cleaning up chart references...");
      // Unsubscribe inside the check
      currentChart.unsubscribeCrosshairMove(handleCrosshairMove);
      // currentChart.timeScale().unsubscribeVisibleLogicalRangeChange(setLogicalRange);

      // Remove series *before* removing the chart
      // removeRsiSeries(currentChart, rsiSeriesRef); // Assuming implementation
      if (currentMacdInstances) {
          removeMacdSeries(currentChart, macdSeriesInstancesRef); // Pass the ref itself
      }

      console.log("Removing chart...");
      currentChart.remove();
    }

    // Nullify refs *after* potential cleanup operations
    console.log("Nullifying refs...");
    chartRef.current = null;
    candleSeriesRef.current = null;
    lineSeriesRef.current = null;
    barSeriesRef.current = null;
    maSeriesRef.current = null;
    rsiSeriesRef.current = null;
    macdSeriesInstancesRef.current = { macdLineSeries: null, signalLineSeries: null, histogramSeries: null };
    markersRef.current = []; // Clear markers ref as well

  }, [handleCrosshairMove, removeMacdSeries, handleResize]); // Add handleResize dependency

  // Chart initialization - only run once on client-side
  useEffect(() => {
    if (!isClient || !chartContainerRef.current) return;

    // Clean up previous chart and ensure we don't recreate chart if already exists
    if (chartRef.current) {
      console.log("Chart already exists, cleaning up...");
      cleanupChart();
    }
    
    // Set optimal container height for multiple panels
    if (chartContainerRef.current) {
      // 親コンテナの高さを継承し、全画面表示を実現
      chartContainerRef.current.style.height = '100%';
      chartContainerRef.current.style.width = '100%';
    }

    import('lightweight-charts').then(LightweightCharts => {
      const {
        createChart,
      } = LightweightCharts;

      // Null チェックを再実行（非同期処理のため）
      if (!chartContainerRef.current) {
        console.log("Container is no longer available");
        return;
      }

      // Get theme colors from CSS variables (raw HSL values without hsl() wrapper)
      const backgroundHsl = getCssVar('--background');
      const foregroundHsl = getCssVar('--foreground');
      
      // コンテナ要素を安全に取得
      const container = chartContainerRef.current;
      const borderHsl = getCssVar('--border');
      const mutedForegroundHsl = getCssVar('--muted-foreground');
      const primaryHsl = getCssVar('--primary');

      // Convert HSL values to RGBA using the helper function
      const backgroundColor = hslCssVarToRgba(backgroundHsl, theme === 'dark' ? '#1e1e2d' : '#ffffff');
      const textColor = hslCssVarToRgba(foregroundHsl, theme === 'dark' ? '#d1d5db' : '#1e293b');
      const gridColor = hslCssVarToRgba(borderHsl, theme === 'dark' ? '#2e2e3a' : '#f1f5f9');
      const crosshairColor = hslCssVarToRgba(mutedForegroundHsl, theme === 'dark' ? '#a1a1aa' : '#71717a'); // Adjusted fallbacks
      const primaryColor = hslCssVarToRgba(primaryHsl, theme === 'dark' ? '#3b82f6' : '#2563eb'); // Adjusted fallbacks

      const options = {
        ...chartOptions,
        layout: {
          ...chartOptions.layout,
          background: { color: backgroundColor }, // Use converted color
          textColor: textColor, // Use converted color
        },
        grid: {
          ...chartOptions.grid,
          vertLines: {
            color: gridColor, // Use converted color
            style: chartOptions.grid.vertLines.style,
          },
          horzLines: {
            color: gridColor, // Use converted color
            style: chartOptions.grid.horzLines.style,
          },
        },
        crosshair: {
          ...chartOptions.crosshair,
          vertLine: {
            ...chartOptions.crosshair.vertLine,
            color: crosshairColor,
            labelBackgroundColor: primaryColor,
          },
          horzLine: {
            ...chartOptions.crosshair.horzLine,
            color: crosshairColor,
            labelBackgroundColor: primaryColor,
          },
        },
        timeScale: {
          ...chartOptions.timeScale,
          borderColor: gridColor, // Use converted color
        },
        rightPriceScale: {
          ...chartOptions.rightPriceScale,
          borderColor: gridColor, // Use converted color
        },
        width: container.clientWidth,
        height: container.clientHeight,
      };

      // Create chart
      const chart = createChart(container, options);
      chartRef.current = chart;

      // Add series using specific methods
      candleSeriesRef.current = chart.addCandlestickSeries({
        ...candleSeriesOptions,
        visible: chartType === "candles",
      });

      lineSeriesRef.current = chart.addLineSeries({
        ...lineSeriesOptions,
        visible: chartType === "line",
      });

      barSeriesRef.current = chart.addBarSeries({
        ...barSeriesOptions,
        visible: chartType === "bar",
      });

      // MA is a LineSeries
      maSeriesRef.current = chart.addLineSeries({
        ...maSeriesOptions,
        visible: true,
      });

      // Calculate RSI data
      const closePrices = data.map(d => d.close);
      const rsiPeriod = 14;
      const rsiValuesRaw = RsiIndicator.calculate({ values: closePrices, period: rsiPeriod });
      const rsiDataAligned: LineData<Time>[] = [];
      if (data.length >= rsiPeriod) {
        data.slice(rsiPeriod -1).forEach((d, index) => {
          if (rsiValuesRaw[index] !== undefined) { // Ensure value exists
             rsiDataAligned.push({
               time: (new Date(d.time).getTime() / 1000) as UTCTimestamp,
               value: rsiValuesRaw[index],
             });
          }
        });
      }

      // Calculate MACD data
      const macdValuesRaw = calculateMacdValues(closePrices);
      const alignedMacdData = alignMacdData(data, macdValuesRaw);

      // TradingView風のパネル設定
      // パネル1（メインチャート）の比率設定
      chart.applyOptions({
        watermark: {
          visible: false,
        },
        leftPriceScale: {
          visible: false,
        },
        rightPriceScale: {
          visible: true,
        },
      });
      
      // メインチャートパネルのプライススケール設定
      chart.priceScale('right').applyOptions({
        scaleMargins: {
          top: 0.05, // メインチャートの上部マージン
          bottom: 0.35, // メインチャートの下部マージン - インジケーター用に十分なスペース確保
        },
        borderVisible: true,
        borderColor: theme === "dark" ? '#363A45' : '#C3BCBC',
      });
      
      // メインチャートにラベルを追加
      chart.applyOptions({
        watermark: {
          visible: true,
          color: theme === "dark" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          text: 'BTC/USD',
          fontSize: 36,
          horzAlign: 'left',
          vertAlign: 'top',
        },
      });

      // RSIパネル（1）を設定 - メインチャートとは別のパネルに配置
      addOrUpdateRsiSeries(chart, rsiDataAligned, 1, rsiSeriesRef);
      
      // RSIパネルの比率設定 - メインチャートの下に配置（全体の15%の高さ）
      chart.priceScale(`rsi_price_scale_1`).applyOptions({
        scaleMargins: {
          top: 0.65, // RSIパネルの上部マージン - メインチャートの下
          bottom: 0.25, // RSIパネルの下部マージン
        },
        autoScale: false, // RSIは固定スケール (0-100)
        entireTextOnly: true,
        borderVisible: true,
        borderColor: theme === "dark" ? '#363A45' : '#C3BCBC',
      });
      
      // RSIパネルにパネル名を追加
      if (rsiSeriesRef.current) {
        // RSIパネルラベルを追加
        rsiSeriesRef.current.createPriceLine({
          price: 50, // RSIの中間値
          color: theme === "dark" ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          lineWidth: 1 as const, // as const で型エラー修正
          lineStyle: 2, // 点線
          axisLabelVisible: true,
          title: 'RSI (14)', // パネル名
          axisLabelColor: theme === "dark" ? '#9598A1' : '#787B86',
        });
      }

      // MACDパネル（2）を設定 - RSIの下に配置
      if (chartRef.current) {
        addOrUpdateMacdSeries(chart, alignedMacdData, 2, macdSeriesInstancesRef);
        
        // MACDパネルの比率設定 - RSIの下に配置（全体の15%の高さ）
        chart.priceScale(`macd_price_scale_2`).applyOptions({
          scaleMargins: {
            top: 0.75, // MACDパネルの上部マージン - RSIの下に配置
            bottom: 0.0, // MACDパネルの下部マージン
          },
          entireTextOnly: true,
          borderVisible: true,
          borderColor: theme === "dark" ? '#363A45' : '#C3BCBC',
        });
        
        // MACDパネルにラベルを追加
        const macdInstances = macdSeriesInstancesRef.current;
        if (macdInstances.macdLineSeries) {
          // MACDパネルラベル用に横線を追加
          macdInstances.macdLineSeries.createPriceLine({
            price: 0, // ゼロライン
            color: theme === "dark" ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            lineWidth: 1 as const, // as const で型エラー修正
            lineStyle: 2, // 点線
            axisLabelVisible: true,
            title: 'MACD (12,26,9)', // より詳細なパネル名（パラメーター表示）
            axisLabelColor: theme === "dark" ? '#9598A1' : '#787B86',
          });
        }
      }

      // Set initial data
      if (data.length) {
        try {
          const candleData: CandlestickData[] = data.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))

          const lineData: LineData[] = data.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            value: item.close,
          }))

          const barData: BarData[] = data.map((item) => ({
            time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          }))

          if (candleSeriesRef.current) candleSeriesRef.current.setData(candleData);
          if (lineSeriesRef.current) lineSeriesRef.current.setData(lineData);
          if (barSeriesRef.current) barSeriesRef.current.setData(barData);

          // MA
          const maPeriod = getMAPeriodForTimeframe(timeframe)
          if (data.length >= maPeriod) {
            const maData: LineData[] = []
            for (let i = maPeriod - 1; i < data.length; i++) {
              const sum = data.slice(i - maPeriod + 1, i + 1).reduce((acc, item) => acc + item.close, 0)
              maData.push({
                time: (new Date(data[i].time).getTime() / 1000) as UTCTimestamp,
                value: sum / maPeriod,
              })
            }
            if (maSeriesRef.current) maSeriesRef.current.setData(maData)
          }

          chart.timeScale().fitContent()
        } catch (err) {
          console.error("Failed to set initial data", err)
        }
      }

      // Add resize listener *after* chart is created
      window.addEventListener("resize", handleResize);

      // Return the memoized cleanup function
      return cleanupChart;
    }).catch(err => {
      console.error("Failed to load lightweight-charts or initialize chart", err);
      // Ensure cleanup runs even if initialization fails mid-way
      cleanupChart();
    });

  }, [
    // Core dependencies for initialization
    isClient,
    theme,
    chartOptions,
    candleSeriesOptions,
    maSeriesOptions,
    lineSeriesOptions,
    barSeriesOptions,
    chartType,
    // Data and indicators (needed for initial setup inside)
    data, // data is used to calculate indicators initially
    entries, // entries are used for markers initially
    addOrUpdateRsiSeries,
    addOrUpdateMacdSeries,
    createEntryMarkers,
    // Functions needed by the effect or cleanup
    handleResize,
    handleCrosshairMove,
    cleanupChart,
  ])

  // Update theme
  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.applyOptions({
      layout: {
        background: {
          color: hslCssVarToRgba(getCssVar('--background'), theme === 'dark' ? '#1e1e2d' : '#ffffff'),
        },
        textColor: hslCssVarToRgba(getCssVar('--foreground'), theme === 'dark' ? '#d1d5db' : '#1e293b'),
      },
      grid: {
        vertLines: {
          color: hslCssVarToRgba(getCssVar('--border'), theme === 'dark' ? '#2e2e3a' : '#f1f5f9'),
        },
        horzLines: {
          color: hslCssVarToRgba(getCssVar('--border'), theme === 'dark' ? '#2e2e3a' : '#f1f5f9'),
        },
      },
    })
  }, [theme])

  // Update chart type visibility
  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current || !barSeriesRef.current) return

    candleSeriesRef.current.applyOptions({ visible: chartType === "candles" })
    lineSeriesRef.current.applyOptions({ visible: chartType === "line" })
    barSeriesRef.current.applyOptions({ visible: chartType === "bar" })
  }, [chartType, isClient])

  // Set time format based on timeframe
  useEffect(() => {
    if (!chartRef.current) return

    const timeScaleOptions: any = {
      timeVisible: true,
      secondsVisible: false,
    }

    // Adjust format based on timeframe
    if (timeframe === "1m" || timeframe === "5m" || timeframe === "15m") {
      timeScaleOptions.timeVisible = true
      timeScaleOptions.secondsVisible = false
    }

    chartRef.current.applyOptions({
      timeScale: timeScaleOptions,
    })
  }, [timeframe])

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !isClient) return

    // Guard against data not being an array
    if (!Array.isArray(data)) {
      console.warn("ChartCanvas: Data is not an array, skipping update.", data)
      // Optionally clear series or show loading state
      if (candleSeriesRef.current) candleSeriesRef.current.setData([]);
      if (lineSeriesRef.current) lineSeriesRef.current.setData([]);
      if (barSeriesRef.current) barSeriesRef.current.setData([]);
      if (maSeriesRef.current) maSeriesRef.current.setData([]);
      if (rsiSeriesRef.current) rsiSeriesRef.current.setData([]);
      if (macdSeriesInstancesRef.current) {
        macdSeriesInstancesRef.current.macdLineSeries?.setData([]);
        macdSeriesInstancesRef.current.signalLineSeries?.setData([]);
        macdSeriesInstancesRef.current.histogramSeries?.setData([]);
      }
      return;
    }

    try {
      // Map data to chart series format
      const candleData: CandlestickData[] = data.map((item) => ({
        time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      const lineData: LineData[] = data.map((item) => ({
        time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
        value: item.close,
      }))

      const barData: BarData[] = data.map((item) => ({
        time: (new Date(item.time).getTime() / 1000) as UTCTimestamp,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }))

      if (candleSeriesRef.current) candleSeriesRef.current.setData(candleData);
      if (lineSeriesRef.current) lineSeriesRef.current.setData(lineData);
      if (barSeriesRef.current) barSeriesRef.current.setData(barData);

      // Calculate and set moving average
      const maPeriod = getMAPeriodForTimeframe(timeframe)

      if (data.length >= maPeriod) {
        const maData: LineData[] = []
        for (let i = maPeriod - 1; i < data.length; i++) {
          const sum = data.slice(i - maPeriod + 1, i + 1).reduce((acc, item) => acc + item.close, 0)
          maData.push({
            time: (new Date(data[i].time).getTime() / 1000) as UTCTimestamp,
            value: sum / maPeriod,
          })
        }
        if (maSeriesRef.current) maSeriesRef.current.setData(maData)
      }

      // Calculate RSI data
      const closePrices = data.map(d => d.close);
      const rsiPeriod = 14;
      const rsiValuesRaw = RsiIndicator.calculate({ values: closePrices, period: rsiPeriod });
      const rsiDataAligned: LineData<Time>[] = [];
      if (data.length >= rsiPeriod) {
        data.slice(rsiPeriod -1).forEach((d, index) => {
          if (rsiValuesRaw[index] !== undefined) { // Ensure value exists
             rsiDataAligned.push({
               time: (new Date(d.time).getTime() / 1000) as UTCTimestamp,
               value: rsiValuesRaw[index],
             });
          }
        });
      }

      if (rsiSeriesRef.current) rsiSeriesRef.current.setData(rsiDataAligned);

      // Calculate MACD data
      const macdValuesRaw = calculateMacdValues(closePrices);
      const alignedMacdData = alignMacdData(data, macdValuesRaw);

      // Add null check for chartRef.current here as well
      if (chartRef.current && macdSeriesInstancesRef.current) {
          addOrUpdateMacdSeries(chartRef.current, alignedMacdData, 2, macdSeriesInstancesRef);
      }

      // Fit content
      chartRef.current.timeScale().fitContent()
    } catch (error) {
      console.error("Error updating chart data:", error)
    }
  }, [data, timeframe, isClient])

  // Update markers for entries and exits
  useEffect(() => {
    if (!candleSeriesRef.current || !isClient) return

    try {
      // Filter out canceled entries
      const filteredEntries = entries.filter((entry) => entry.status !== "canceled")

      if (filteredEntries.length === 0) {
        // Clear markers if no entries
        if (markersRef.current.length > 0) {
          if (candleSeriesRef.current) (candleSeriesRef.current as ISeriesApi<"Candlestick", Time, CandlestickData<Time> | WhitespaceData<Time>, CandlestickSeriesOptions, DeepPartial<CandlestickSeriesOptions>>).setMarkers([])
          markersRef.current = []
        }
        return
      }

      // Create markers for entries and exits
      const entryMarkers = createEntryMarkers(filteredEntries)
      const exitMarkers = createExitMarkers(filteredEntries)

      // Combine all markers
      const allMarkers = [...entryMarkers, ...exitMarkers]

      // Only update if markers have changed
      const markersString = JSON.stringify(allMarkers)
      const prevMarkersString = JSON.stringify(markersRef.current)

      if (markersString !== prevMarkersString) {
        if (candleSeriesRef.current) {
          (candleSeriesRef.current as ISeriesApi<"Candlestick", Time, CandlestickData<Time> | WhitespaceData<Time>, CandlestickSeriesOptions, DeepPartial<CandlestickSeriesOptions>>).setMarkers(allMarkers)
          markersRef.current = allMarkers
        }
      }
    } catch (error) {
      console.error("Error updating markers:", error)
    }
  }, [entries, isClient])

  return (
    <div className="w-full h-full" ref={chartContainerRef}>
      {/* Chart will be rendered here */}
    </div>
  )
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
    color: entry.side === "buy" ? "#10b981" : "#ef4444",
    shape: entry.side === "buy" ? "arrowUp" : "arrowDown",
    text: entry.side === "buy" ? "BUY" : "SELL",
    size: 2,
  }))
}

// Create exit markers
function createExitMarkers(entries: Entry[]): SeriesMarker<Time>[] {
  return entries
    .filter((entry) => entry.status === "closed" && entry.exitTime)
    .map((entry) => ({
      time: (new Date(entry.exitTime!).getTime() / 1000) as UTCTimestamp,
      position: entry.side === "buy" ? "aboveBar" : "belowBar",
      color: entry.profit && entry.profit > 0 ? "#10b981" : "#ef4444",
      shape: "circle",
      text: "EXIT",
      size: 2,
    }))
}
