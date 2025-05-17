// components/chart/drawing-tools/trendline.ts
// Simple trend line drawing tool for lightweight-charts

import {
  IChartApi,
  ISeriesApi,
  LineSeries,
  LineStyle,
  LineWidth,
  Time,
} from 'lightweight-charts';

/** Point used for drawing */
interface Point {
  time: Time;
  price: number;
}

/** Options for the trend line */
export interface TrendLineOptions {
  color?: string;
  width?: LineWidth;
  style?: LineStyle;
}

/** Trend line object */
export interface TrendLine {
  start: Point;
  end: Point;
  id: string;
  series: ISeriesApi<'Line'>;
}

/** Draw a trend line on the chart */
export function drawTrendLine(
  chart: IChartApi,
  start: Point,
  end: Point,
  options: TrendLineOptions = {},
): TrendLine {
  const lineSeries = (chart as any).addLineSeries({
    color: options.color || '#e91e63',
    lineWidth: options.width ?? 1,
    lineStyle: options.style ?? LineStyle.Solid,
    priceLineVisible: false,
    lastValueVisible: false,
  });

  lineSeries.setData([
    { time: start.time, value: start.price },
    { time: end.time, value: end.price },
  ]);

  const id = `trend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return { start, end, id, series: lineSeries };
}

/** Remove a trend line */
export function removeTrendLine(chart: IChartApi, line: TrendLine): void {
  if (!chart || !line || !line.series) return;
  chart.removeSeries(line.series);
}

/**
 * Create interactive trend line drawing tool
 */
export function createTrendLineTool(
  chart: IChartApi,
  series: ISeriesApi<any>,
  options?: TrendLineOptions,
  onComplete?: (line: TrendLine) => void,
): { start: () => void; cancel: () => void } {
  if (!chart || !series) {
    throw new Error('Chart and series must be provided');
  }

  let drawing = false;
  let startPoint: Point | null = null;
  let currentLine: TrendLine | null = null;

  const clickHandler = (param: any) => {
    if (!param.time || param.seriesPrices === undefined) return;
    const price = param.seriesPrices.get(series) as number;
    if (price === undefined) return;

    if (!drawing) {
      drawing = true;
      startPoint = { time: param.time as Time, price };
    } else {
      drawing = false;
      if (startPoint) {
        const endPoint = { time: param.time as Time, price };
        if (currentLine) removeTrendLine(chart, currentLine);
        currentLine = drawTrendLine(chart, startPoint, endPoint, options);
        onComplete?.(currentLine);
      }
      chart.unsubscribeClick(clickHandler);
      try {
        (chart as any).unsubscribeMouseMove?.(moveHandler);
      } catch {
        /* noop */
      }
      startPoint = null;
    }
  };

  const moveHandler = (param: any) => {
    if (!drawing || !startPoint || !param.time || param.seriesPrices === undefined) return;
    const price = param.seriesPrices.get(series) as number;
    if (price === undefined) return;

    if (currentLine) {
      removeTrendLine(chart, currentLine);
    }
    const cur = { time: param.time as Time, price };
    currentLine = drawTrendLine(chart, startPoint, cur, options);
  };

  const cancel = () => {
    if (currentLine) {
      removeTrendLine(chart, currentLine);
      currentLine = null;
    }
    chart.unsubscribeClick(clickHandler);
    try {
      (chart as any).unsubscribeMouseMove?.(moveHandler);
    } catch {
      /* noop */
    }
    drawing = false;
    startPoint = null;
  };

  const startDraw = () => {
    cancel();
    chart.subscribeClick(clickHandler);
    try {
      (chart as any).subscribeMouseMove?.(moveHandler);
    } catch {
      /* noop */
    }
  };

  return { start: startDraw, cancel };
}

