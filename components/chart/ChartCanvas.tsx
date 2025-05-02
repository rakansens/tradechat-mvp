// Dynamically imported lightweight-charts and ensured chart initialization runs only on the client-side.
// Added isClient state and modified useEffect hooks accordingly.
"use client"

import { useEffect, useRef, useState } from "react"
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
import type { Entry, Timeframe } from "@/types"
import { useChartConfig } from "@/hooks/useChartConfig"
import { useTheme } from "next-themes"

interface ChartCanvasProps {
  data: any[]
  entries?: Entry[]
  timeframe: Timeframe
  chartType: "candles" | "line" | "bar"
}

export default function ChartCanvas({ data, entries = [], timeframe, chartType }: ChartCanvasProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", Time, CandlestickData<Time> | WhitespaceData<Time>, CandlestickSeriesOptions, DeepPartial<CandlestickSeriesOptions>> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const barSeriesRef = useRef<ISeriesApi<"Bar"> | null>(null)
  const maSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const markersRef = useRef<any[]>([])
  const { theme } = useTheme()
  const [isClient, setIsClient] = useState(false)

  // Helper function to get CSS variable value
  const getCssVar = (name: string): string => {
    if (typeof document === 'undefined') return '' // Guard for SSR
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Get chart configuration
  const { chartOptions, candleSeriesOptions, maSeriesOptions } = useChartConfig()

  // Define lineSeriesOptions and barSeriesOptions
  const lineSeriesOptions = {
    color: "#2962FF",
    lineWidth: 2,
    title: "Price",
  }

  const barSeriesOptions = {
    upColor: "#10b981",
    downColor: "#ef4444",
    thinBars: false,
    title: "Price",
  }

  // Set isClient to true on mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Chart initialization - only run once on client-side
  useEffect(() => {
    if (!chartContainerRef.current || !isClient) return

    // Avoid duplicate initialization
    if (chartRef.current) return

    const container = chartContainerRef.current // capture current for async safety

    import('lightweight-charts').then(LightweightCharts => {
      const {
        createChart,
        CandlestickSeries,
        LineSeries,
        BarSeries,
      } = LightweightCharts as any;

      // Container might be null if component unmounted before import resolves
      if (!container) return

      // Get theme colors from CSS variables
      const backgroundColor = `hsl(${getCssVar('--background')})`
      const textColor = `hsl(${getCssVar('--foreground')})`
      const gridColor = `hsl(${getCssVar('--border')})`
      const crosshairColor = `hsl(${getCssVar('--muted-foreground')})` // Or use --foreground
      const primaryColor = `hsl(${getCssVar('--primary')})`

      const options = {
        ...chartOptions,
        layout: {
          ...chartOptions.layout,
          background: {
            color: backgroundColor || (theme === "dark" ? "#1e1e2d" : "#ffffff"), // Fallback
          },
          textColor: textColor || (theme === "dark" ? "#d1d5db" : "#1e293b"), // Fallback
        },
        grid: {
          ...chartOptions.grid,
          vertLines: {
            color: gridColor || (theme === "dark" ? "#2e2e3a" : "#f1f5f9"), // Fallback
            style: chartOptions.grid.vertLines.style,
          },
          horzLines: {
            color: gridColor || (theme === "dark" ? "#2e2e3a" : "#f1f5f9"), // Fallback
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
          borderColor: gridColor, // Use grid/border color
        },
        rightPriceScale: {
          ...chartOptions.rightPriceScale,
          borderColor: gridColor, // Use grid/border color
        },
        width: container.clientWidth,
        height: container.clientHeight,
      };

      // Create chart
      const chart = createChart(container, options);
      chartRef.current = chart;

      // Add series
      candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
        ...candleSeriesOptions,
        visible: chartType === "candles",
      })

      lineSeriesRef.current = chart.addSeries(LineSeries, {
        ...lineSeriesOptions,
        visible: chartType === "line",
      })

      barSeriesRef.current = chart.addSeries(BarSeries, {
        ...barSeriesOptions,
        visible: chartType === "bar",
      })

      maSeriesRef.current = chart.addSeries(LineSeries, {
        ...maSeriesOptions,
        visible: true,
      })

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

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          })
        }
      }

      window.addEventListener("resize", handleResize)

      // Cleanup function
      return () => {
        window.removeEventListener("resize", handleResize)

        if (chartRef.current) {
          chartRef.current.remove()
          chartRef.current = null
          candleSeriesRef.current = null
          lineSeriesRef.current = null
          barSeriesRef.current = null
          maSeriesRef.current = null
        }
      }
    }).catch(err => console.error("Failed to load lightweight-charts", err));

  }, [isClient, theme, chartOptions, candleSeriesOptions, maSeriesOptions, lineSeriesOptions, barSeriesOptions, chartType])

  // Update theme
  useEffect(() => {
    if (!chartRef.current) return

    chartRef.current.applyOptions({
      layout: {
        background: {
          color: `hsl(${getCssVar('--background')})`,
        },
        textColor: `hsl(${getCssVar('--foreground')})`,
      },
      grid: {
        vertLines: {
          color: `hsl(${getCssVar('--border')})`,
        },
        horzLines: {
          color: `hsl(${getCssVar('--border')})`,
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
