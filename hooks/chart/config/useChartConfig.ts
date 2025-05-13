/**
 * hooks/chart/config/useChartConfig.ts
 * 
 * チャート設定オプションを提供するカスタムフック
 * Lightweight Chartsの各種設定をmemoized値として提供
 *
 * 変更履歴:
 * - 2023-06-05: 初期実装
 * - 2023-08-10: ラインチャートとバーチャートのオプション追加
 * - 2025-05-15: フックのリファクタリングに伴いhooks/chart/configディレクトリに移動
 */

"use client"

import { useMemo } from "react"
import { CrosshairMode, LineStyle, LineWidth } from "lightweight-charts"

/**
 * チャート設定オプションを提供するフック
 * @returns 各種チャート設定のオブジェクト
 */
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
          width: 1 as LineWidth,
          style: LineStyle.Solid,
          labelBackgroundColor: "#3b82f6",
        },
        horzLine: {
          color: "#6b7280",
          width: 1 as LineWidth,
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
      lineWidth: 2 as LineWidth,
      title: "MA 50",
    }),
    [],
  )

  const lineSeriesOptions = useMemo(
    () => ({
      color: "#2962FF",
      lineWidth: 1 as LineWidth,
      title: "Line",
    }),
    []
  );

  // Define bar series options
  const barSeriesOptions = useMemo(
    () => ({
      upColor: "#10b981", // Green for up bars
      downColor: "#ef4444", // Red for down bars
      thinBars: false, // Use thicker bars
      title: "Bar",
    }),
    []
  );

  return {
    chartOptions,
    candleSeriesOptions,
    maSeriesOptions,
    lineSeriesOptions,
    barSeriesOptions,
  }
}