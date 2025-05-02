"use client"

import { useMemo } from "react"
import { CrosshairMode, LineStyle } from "lightweight-charts"

export function useChartConfig() {
  const chartOptions = useMemo(
    () => ({
      layout: {
        background: { color: "#1e293b" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#334155", style: LineStyle.Dotted },
        horzLines: { color: "#334155", style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#6b7280",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: "#3b82f6",
        },
        horzLine: {
          color: "#6b7280",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: "#3b82f6",
        },
      },
      timeScale: {
        borderColor: "#475569",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#475569",
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }),
    [],
  )

  const candleSeriesOptions = useMemo(
    () => ({
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    }),
    [],
  )

  const maSeriesOptions = useMemo(
    () => ({
      color: "#eab308",
      lineWidth: 2,
      title: "MA 50",
    }),
    [],
  )

  return {
    chartOptions,
    candleSeriesOptions,
    maSeriesOptions,
  }
}
