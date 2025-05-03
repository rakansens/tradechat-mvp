// hooks/useLightweightChart.ts
// 新規: チャート初期化＆データ更新を担当するカスタム Hook
//  - チャートインスタンス生成・破棄
//  - データ変更時のシリーズ更新
//  - ウィンドウリサイズ対応
// 今後: インジケータ・描画ツール描画もここで拡張予定

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  UTCTimestamp,
  ISeriesApi,
} from "lightweight-charts";
import { OHLCData, ChartType } from "../types/chart";

export interface UseLightweightChartParams {
  chartContainer: HTMLDivElement | null;
  data: OHLCData[];
  chartType: ChartType;
}

export const useLightweightChart = ({
  chartContainer,
  data,
  chartType,
}: UseLightweightChartParams) => {
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<
    ISeriesApi<"Candlestick"> | ISeriesApi<"Line"> | ISeriesApi<"Area"> | null
  >(null);

  // チャート初期化
  useEffect(() => {
    if (!chartContainer) return;

    // 以前のインスタンスがあれば破棄
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    const { width, height } = chartContainer.getBoundingClientRect();
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
      rightPriceScale: { borderColor: "#1F2937" },
      crosshair: { mode: 0 },
    });

    // メインシリーズ作成
    switch (chartType) {
      case "candles": {
        seriesRef.current = chart.addCandlestickSeries({
          upColor: "#26A69A",
          downColor: "#EF5350",
          borderVisible: false,
          wickUpColor: "#26A69A",
          wickDownColor: "#EF5350",
        });
        break;
      }
      case "line": {
        seriesRef.current = chart.addLineSeries({ color: "#2962FF", lineWidth: 2 });
        break;
      }
      case "area": {
        seriesRef.current = chart.addAreaSeries({
          lineColor: "#2962FF",
          topColor: "rgba(41, 98, 255, 0.28)",
          bottomColor: "rgba(41, 98, 255, 0.05)",
          lineWidth: 2,
        });
        break;
      }
      case "bar": {
        // ライブラリに bar シリーズが無いため line と同様で代替
        seriesRef.current = chart.addLineSeries({ color: "#2962FF", lineWidth: 2 });
        break;
      }
      default:
        break;
    }

    chartInstanceRef.current = chart;

    return () => {
      chart.remove();
      chartInstanceRef.current = null;
      seriesRef.current = null;
    };
  }, [chartContainer, chartType]);

  // データ更新
  useEffect(() => {
    if (!seriesRef.current) return;
    const sorted = [...data].sort((a, b) => a.time - b.time);

    if (chartType === "candles") {
      (seriesRef.current as ISeriesApi<"Candlestick">).setData(
        sorted.map((d) => ({
          time: (d.time / 1000) as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else {
      (seriesRef.current as ISeriesApi<"Line"> | ISeriesApi<"Area">).setData(
        sorted.map((d) => ({
          time: (d.time / 1000) as UTCTimestamp,
          value: d.close,
        }))
      );
    }
  }, [data, chartType]);

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      if (!chartContainer || !chartInstanceRef.current) return;
      const { width, height } = chartContainer.getBoundingClientRect();
      chartInstanceRef.current.applyOptions({ width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [chartContainer]);
};
