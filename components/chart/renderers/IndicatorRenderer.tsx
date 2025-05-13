'use client';

// components/chart/renderers/IndicatorRenderer.tsx
// 作成: テクニカル指標の描画ロジックを担当するレンダラーコンポーネント
// 更新: 型エラーを修正

import { useEffect, useRef } from 'react';
import { IChartApi, ISeriesApi, LineSeriesPartialOptions } from 'lightweight-charts';

interface IndicatorRendererProps {
  chart: IChartApi | null;
  data: any[];
  options?: LineSeriesPartialOptions;
  indicatorType: 'ma' | 'bollinger' | 'rsi' | 'macd';
  pane?: 'main' | 'sub';
  onSeriesCreated?: (series: ISeriesApi<'Line'>) => void;
}

export function IndicatorRenderer({ 
  chart, 
  data, 
  options, 
  indicatorType,
  pane = 'main',
  onSeriesCreated 
}: IndicatorRendererProps) {
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  useEffect(() => {
    if (!chart || !data.length) return;

    if (!seriesRef.current) {
      // 指標シリーズの作成
      let seriesOptions = { ...options };
      
      // 指標タイプに基づいてデフォルトのオプションを設定
      switch (indicatorType) {
        case 'ma':
          seriesOptions = { 
            ...seriesOptions, 
            color: '#2962FF',
            lineWidth: 2,
            priceScaleId: 'right',
          };
          break;
        case 'bollinger':
          seriesOptions = { 
            ...seriesOptions,
            // ここで条件分岐するのではなく、渡された色を使用
            color: options?.color || '#26A69A',
            lineWidth: 2, // 小数点値ではなく整数を使用
            priceScaleId: 'right',
          };
          break;
        case 'rsi':
          seriesOptions = { 
            ...seriesOptions,
            color: '#FF9800',
            lineWidth: 2,
            priceScaleId: 'right',
            // RSIは通常は別のペインに表示
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          };
          break;
        case 'macd':
          seriesOptions = { 
            ...seriesOptions,
            color: '#2962FF',
            lineWidth: 2,
            priceScaleId: 'right',
            // MACDも通常は別のペインに表示
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          };
          break;
      }
      
      // ペインが'sub'の場合は別のペインを作成
      if (pane === 'sub') {
        seriesOptions.priceScaleId = `${indicatorType}-scale`;
      }
      
      // addLineSeries -> addSeries(LineSeries) に修正
      const series = chart.addSeries('Line', seriesOptions);
      series.setData(data);
      seriesRef.current = series;

      // 作成したシリーズを親コンポーネントに通知
      if (onSeriesCreated) {
        onSeriesCreated(series);
      }
    } else {
      // 既存のシリーズのデータを更新
      seriesRef.current.setData(data);
      
      // オプションが変更された場合は更新
      if (options) {
        seriesRef.current.applyOptions(options);
      }
    }

    return () => {
      if (seriesRef.current && chart) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
    };
  }, [chart, data, options, indicatorType, pane, onSeriesCreated]);

  // このコンポーネントはUIをレンダリングせず、チャートのロジックのみを扱う
  return null;
} 