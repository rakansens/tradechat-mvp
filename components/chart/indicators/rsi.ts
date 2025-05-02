// Logic for calculating and displaying RSI
import {
  IChartApi,
  ISeriesApi,
  LineData,
  LineStyle,
  Time,
  createChart,
} from 'lightweight-charts';
import { RSI as RsiIndicator } from 'technicalindicators';

/**
 * Calculates RSI data from price data.
 * @param prices - Array of closing prices.
 * @param period - The RSI period (default: 14).
 * @returns Array of RSI values matching the input price data length (with initial NaNs).
 */
export function calculateRsiData(
  prices: number[],
  period: number = 14
): LineData<Time>[] {
  if (prices.length < period) {
    return []; // Not enough data to calculate RSI
  }

  const rsiValues = RsiIndicator.calculate({ values: prices, period });

  // Need to align RSI output with the original price data timeline.
  // technicalindicators output is shorter than input by (period - 1).
  // We also need the 'time' property from the original data.
  // This part requires the original data with time information.
  // Let's assume the ChartCanvas will handle the alignment for now.
  // This function will just return the calculated values.

  // For now, let's return a placeholder structure. The actual implementation
  // will need the time data associated with the prices.
  console.warn(
    'calculateRsiData needs time information for proper LineData structure'
  );
  const rsiData: LineData<Time>[] = [];
  const candles = prices.map((price, index) => ({ time: (Date.now() / 1000 + index) as Time, price }));
  // Start from the 'period'-th candle, as RSI calculation needs prior data
  for (let i = period - 1; i < candles.length; i++) {
    // Make sure candles[i] and rsiValues[i - (period - 1)] exist
    const candleTime = candles[i]?.time;
    const rsiValue = rsiValues[i - (period - 1)];

    if (candleTime && typeof candleTime === 'string' && rsiValue !== undefined) {
        // Ensure time is in 'yyyy-mm-dd' format for lightweight-charts
        const formattedTime = candleTime.split('T')[0]; // Extract date part from ISO string

        rsiData.push({
            time: formattedTime as Time, // Cast to Time type
            value: rsiValue,
        });
    }
  }
  return rsiData;
}

/**
 * Adds or updates the RSI series on a given chart pane.
 * @param chart - The main chart instance (IChartApi).
 * @param rsiData - The calculated RSI data array (LineData[]).
 * @param paneIndex - The index of the pane where the RSI should be drawn.
 * @param rsiSeriesRef - A React ref to store the RSI series instance.
 */
export function addOrUpdateRsiSeries(
  chart: IChartApi,
  rsiData: LineData<Time>[],
  paneIndex: number,
  rsiSeriesRef: React.MutableRefObject<ISeriesApi<'Line'> | null>
) {
  if (!chart) return;

  const rsiOptions = {
    color: '#FF9800', // RSIラインをオレンジ色に
    lineWidth: 1 as const,
    title: 'RSI',
    pane: paneIndex,
    priceScaleId: `rsi_price_scale_${paneIndex}`,
    lastValueVisible: true,
    crosshairMarkerVisible: true,
    lastPriceAnimation: 0, // アニメーションなし
    // --- RSI specific options ---
    autoscaleInfoProvider: () => ({
        priceRange: {
            minValue: 0,
            maxValue: 100,
        },
    }),
    priceFormat: {
        type: 'price' as const,
        precision: 1, // 小数点以下1桁に変更
        minMove: 0.1,
    },
    // オーバーボート/オーバーソールドラインは後で追加
  };

  if (rsiSeriesRef.current) {
    // If series exists, update data
    rsiSeriesRef.current.setData(rsiData);
    rsiSeriesRef.current.applyOptions(rsiOptions); // Re-apply options if needed
  } else {
    // If series doesn't exist, create it
    rsiSeriesRef.current = chart.addLineSeries(rsiOptions);

    // Ensure the price scale is configured AFTER the series (and scale) is created
    chart.priceScale(`rsi_price_scale_${paneIndex}`).applyOptions({
        scaleMargins: {
            top: 0.1, // TradingView風のマージン調整
            bottom: 0.1,
        },
        autoScale: false, // RSIは固定スケール (0-100)
        entireTextOnly: true,
        borderVisible: false,
        textColor: '#9598A1', // テキスト色を薄く
    });

    rsiSeriesRef.current.setData(rsiData);

    // オーバーボート/オーバーソールドラインをTradingView風に設定
    rsiSeriesRef.current.createPriceLine({
        price: 70,
        color: '#FF6D00', // オレンジ色
        lineWidth: 1,
        lineStyle: 2, // 点線
        axisLabelVisible: true,
        title: 'Overbought',
    });

    rsiSeriesRef.current.createPriceLine({
        price: 30,
        color: '#2962FF', // 青色
        lineWidth: 1,
        lineStyle: 2, // 点線
        axisLabelVisible: true,
        title: 'Oversold',
    });

  }
}
