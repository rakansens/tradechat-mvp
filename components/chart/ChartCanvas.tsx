// components/chart/ChartCanvas.tsx
// リファクタ: スリム化して useLightweightChart フックを使用
"use client";

import { useRef } from "react";
import { useLightweightChart } from "../../hooks/useLightweightChart";
import { useChartDataStore, useChartConfigStore } from "../../store";
import type { ChartType } from "@/types/chart";

export default function ChartCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const data = useChartDataStore((s) => s.data);
  const chartType = useChartConfigStore((s) => s.chartType) as ChartType;

  useLightweightChart({
    chartContainer: containerRef.current,
    data,
    chartType,
  });

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-dark-800"
      style={{ height: "100%" }}
    />
  );
}
