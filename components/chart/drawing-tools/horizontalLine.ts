// Logic for handling user interaction and drawing horizontal lines
import {
  IChartApi,
  ISeriesApi,
  LineWidth,
  LineStyle,
  IPriceLine,
} from 'lightweight-charts';

/** Options for a horizontal line */
export interface HorizontalLineOptions {
  color?: string;
  width?: LineWidth;
  style?: LineStyle;
  title?: string;
}

/** Horizontal line object */
export interface HorizontalLine {
  price: number;
  id: string;
  line: IPriceLine;
}

/** Draw a horizontal price line */
export function drawHorizontalLine(
  series: ISeriesApi<any>,
  price: number,
  options: HorizontalLineOptions = {},
): HorizontalLine {
  const line = series.createPriceLine({
    price,
    color: options.color || '#e91e63',
    lineWidth: options.width ?? 1,
    lineStyle: options.style ?? LineStyle.Solid,
    axisLabelVisible: true,
    title: options.title ?? price.toString(),
  });

  const id = `hline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return { price, id, line };
}

/** Remove a horizontal price line */
export function removeHorizontalLine(
  series: ISeriesApi<any>,
  line: HorizontalLine,
): void {
  if (!series || !line || !line.line) return;
  series.removePriceLine(line.line);
}

/** Interactive tool to place a horizontal line */
export function createHorizontalLineTool(
  chart: IChartApi,
  series: ISeriesApi<any>,
  options?: HorizontalLineOptions,
  onComplete?: (line: HorizontalLine) => void,
): { start: () => void; cancel: () => void } {
  if (!chart || !series) {
    throw new Error('Chart and series must be provided');
  }

  let currentLine: HorizontalLine | null = null;

  const clickHandler = (param: any) => {
    if (param.seriesPrices === undefined) return;
    const price = param.seriesPrices.get(series) as number;
    if (price === undefined) return;

    if (currentLine) {
      removeHorizontalLine(series, currentLine);
    }
    currentLine = drawHorizontalLine(series, price, options || {});
    onComplete?.(currentLine);

    chart.unsubscribeClick(clickHandler);
  };

  const start = () => {
    cancel();
    chart.subscribeClick(clickHandler);
  };

  const cancel = () => {
    chart.unsubscribeClick(clickHandler);
    if (currentLine) {
      removeHorizontalLine(series, currentLine);
      currentLine = null;
    }
  };

  return { start, cancel };
}

export {};
