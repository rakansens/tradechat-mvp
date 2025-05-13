'use client';

// components/chart/renderers/CandleRenderer.tsx
// 作成: ロウソク足の描画ロジックを担当するレンダラーコンポーネント
// 更新: addCandlestickSeriesメソッドをaddSeries('Candlestick')に修正

import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, CandlestickSeriesPartialOptions } from 'lightweight-charts';

interface CandleRendererProps {
  chart: IChartApi | null;
  data: any[];
  options?: CandlestickSeriesPartialOptions;
  onSeriesCreated?: (series: ISeriesApi<'Candlestick'>) => void;
}

export function CandleRenderer({ chart, data, options, onSeriesCreated }: CandleRendererProps) {
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chart || !data.length) return;

    if (!seriesRef.current) {
      // ロウソク足シリーズの作成
      const series = chart.addSeries('Candlestick', options || {});
      series.setData(data);
      seriesRef.current = series;

      // 作成したシリーズを親コンポーネントに通知
      if (onSeriesCreated) {
        onSeriesCreated(series);
      }
    } else {
      // 既存のシリーズのデータを更新
      seriesRef.current.setData(data);
    }

    return () => {
      if (seriesRef.current && chart) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
    };
  }, [chart, data, options, onSeriesCreated]);

  // このコンポーネントはUIをレンダリングせず、チャートのロジックのみを扱う
  return null;
} 