// components/chart/indicators/macd.ts
// Added functions for MACD calculation (calculateMacdValues, alignMacdData) and chart series management (addOrUpdateMacdSeries, removeMacdSeries).

import {
    IChartApi,
    ISeriesApi,
    LineData,
    HistogramData,
    Time,
    UTCTimestamp,
    DeepPartial,
    LineSeries,
    HistogramSeries,
    SeriesOptionsCommon,
    HistogramStyleOptions,
    PriceFormat,
    LineStyle,
    LineWidth
} from 'lightweight-charts';
import { MACD as MacdIndicator } from 'technicalindicators'; // Import MACD calculation
import { dedupAndSort, safeRemoveSeries } from '@/utils/chartUtils';

/**
 * NaN値をフィルタリングし、有効なデータのみを返す
 * @param data チャートデータ配列
 * @returns NaN値を除外したデータ配列
 */
function filterValidData<T extends { value: number }>(data: Array<T>): Array<T> {
  return data.filter(item => {
    // NaN値や無限大の値をフィルタリング
    return !isNaN(item.value) && isFinite(item.value);
  });
}

// Type for the calculated MACD data structure from technicalindicators
interface MacdValue {
    MACD?: number;
    signal?: number;
    histogram?: number;
}

// Type for the data structure we'll use with lightweight-charts
export interface MacdChartData {
    macdLine: LineData<UTCTimestamp>[];
    signalLine: LineData<UTCTimestamp>[];
    histogramData: HistogramData<UTCTimestamp>[];
}

/**
 * Calculates MACD data using technicalindicators.
 * @param prices - Array of closing prices.
 * @param fastPeriod - Default 12.
 * @param slowPeriod - Default 26.
 * @param signalPeriod - Default 9.
 * @returns Array of MACD values (MACD line, signal line, histogram).
 */
export function calculateMacdValues(
    prices: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
): MacdValue[] {
    if (prices.length < slowPeriod + signalPeriod -1) { // Need enough data for calculation
        console.warn("Not enough data for MACD calculation.");
        return [];
    }
    const macdInput = {
        values: prices,
        fastPeriod: fastPeriod,
        slowPeriod: slowPeriod,
        signalPeriod: signalPeriod,
        SimpleMAOscillator: false, // Use EMA for MACD line
        SimpleMASignal: false,     // Use EMA for Signal line
    };
    return MacdIndicator.calculate(macdInput);
}

/**
 * Aligns calculated MACD values with the original price data timestamps.
 * @param priceData - Original price data with timestamps (e.g., CandlestickData[] or similar).
 * @param macdValues - Raw MACD values calculated by technicalindicators.
 * @param slowPeriod - Must match the slowPeriod used in calculation.
 * @param signalPeriod - Must match the signalPeriod used in calculation.
 * @returns Formatted data ready for lightweight-charts series.
 */
export function alignMacdData(
    priceData: { time: Time; close: number }[], // Needs time and close
    macdValues: MacdValue[],
    slowPeriod = 26,
    signalPeriod = 9
): MacdChartData {
    const alignedData: MacdChartData = { macdLine: [], signalLine: [], histogramData: [] };
    const startIndex = slowPeriod + signalPeriod - 2; // Index offset for MACD output

    if (priceData.length < startIndex + 1 || macdValues.length === 0) {
        return alignedData; // Not enough data or no MACD values
    }

    // Iterate starting from where MACD values become available
    for (let i = startIndex; i < priceData.length; i++) {
        const macdIndex = i - startIndex;
        if (macdIndex >= macdValues.length || macdValues[macdIndex] === undefined) {
            continue; // Skip if index out of bounds or value missing
        }

        const currentMacd = macdValues[macdIndex];
        const rawTime = priceData[i].time;
        // Convert time to UTCTimestamp (number) if it's an ISO string
        const time: UTCTimestamp =
            typeof rawTime === 'string'
                ? (new Date(rawTime).getTime() / 1000) as UTCTimestamp
                : (rawTime as UTCTimestamp);

        if (currentMacd.MACD !== undefined) {
            alignedData.macdLine.push({ time, value: currentMacd.MACD });
        }
        if (currentMacd.signal !== undefined) {
            alignedData.signalLine.push({ time, value: currentMacd.signal });
        }
        if (currentMacd.histogram !== undefined) {
            // Determine histogram color based on value (positive/negative)
            const color = currentMacd.histogram >= 0 ? '#26a69a' : '#ef5350'; // Green for positive, Red for negative
            alignedData.histogramData.push({ time, value: currentMacd.histogram, color });
        }
    }
    return alignedData;
}

// Series instances type for MACD components
export interface MacdSeriesInstances {
  macdLineSeries: ISeriesApi<"Line"> | null;
  signalLineSeries: ISeriesApi<"Line"> | null;
  histogramSeries: ISeriesApi<"Histogram"> | null;
}

/**
 * Adds or updates MACD series (MACD Line, Signal Line, Histogram) on the specified chart pane.
 * Creates the series if they don't exist, otherwise updates their data.
 * @param chart - The IChartApi instance.
 * @param macdData - Formatted MACD data (macdLine, signalLine, histogramData).
 * @param paneIndex - The index of the pane where the MACD should be displayed.
 * @param seriesInstancesRef - Ref object holding the MACD series instances.
 */
export function addOrUpdateMacdSeries(
    chart: IChartApi,
    macdData: MacdChartData,
    paneIndex: number,
    seriesInstancesRef: React.MutableRefObject<MacdSeriesInstances>
) {
    if (!chart || !seriesInstancesRef) return;

    const instances = seriesInstancesRef.current; // Get the current instances object

    // Use a constant custom price scale ID instead of dynamic IDs per pane to avoid invalid price scale errors
    const scaleId = 'macd_scale';

    // Let TypeScript infer the type for options objects
    const macdLineOptions = {
        color: '#2962FF', // Blue for MACD line
        lineWidth: 1 as const,
        priceScaleId: scaleId, // Use shared custom scale
        priceFormat: { type: 'price' as const, precision: 4, minMove: 0.0001 }, // Adjust precision as needed
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        title: 'MACD',
        lastPriceAnimation: 0,
        // より小さいラベル
        priceScale: {
            scaleMargins: { top: 0.2, bottom: 0.2 }, // TradingViewに近いマージンに調整
            autoScale: true,
            entireTextOnly: true,
            borderVisible: false,
            textColor: '#9598A1', // テキスト色を薄く
            fontSize: 10, // フォントサイズを小さく
        },
    };

    const signalLineOptions = {
        color: '#FF9800', // Orange for Signal line
        lineWidth: 1 as const,
        priceScaleId: scaleId, // Same scale as MACD line
        priceFormat: { type: 'price' as const, precision: 4, minMove: 0.0001 },
        lastValueVisible: true,
        priceLineVisible: false,
        crosshairMarkerVisible: true,
        title: 'Signal',
        lastPriceAnimation: 0,
        // より小さいラベル
        priceScale: {
            scaleMargins: { top: 0.2, bottom: 0.2 }, // TradingViewに近いマージンに調整
            autoScale: true,
            entireTextOnly: true,
            borderVisible: false,
            textColor: '#9598A1', // テキスト色を薄く
            fontSize: 10, // フォントサイズを小さく
        },
    };

    const histogramOptions = {
        // Color is set per bar in the data
        title: 'Histogram',
        priceScaleId: scaleId, // Same scale
        priceFormat: { type: 'price' as const, precision: 4, minMove: 0.0001 },
        lastValueVisible: false, // Usually hide histogram value
        priceLineVisible: false,
        base: 0, // Histogram bars grow from the zero line
    };

    // --- MACD Line ---
    if (!instances.macdLineSeries) {
        // v5.0.6では、addLineSeries()の代わりにaddSeries()を使用
        if (typeof chart.addSeries === 'function') {
            instances.macdLineSeries = chart.addSeries(LineSeries, macdLineOptions);
        } else {
            // 古いバージョンの場合
            // @ts-ignore
            instances.macdLineSeries = chart.addLineSeries(macdLineOptions);
        }
        console.log("MACD Line Series Created on Pane:", paneIndex);
    } else {
        instances.macdLineSeries.applyOptions(macdLineOptions);
    }
    // 重複データを排除し昇順ソートしてからセット
    // NaN値をフィルタリング
    const sortedMacdLine = filterValidData(dedupAndSort(macdData.macdLine));
    instances.macdLineSeries.setData(sortedMacdLine);

    // --- Signal Line ---
    if (!instances.signalLineSeries) {
        // v5.0.6では、addLineSeries()の代わりにaddSeries()を使用
        if (typeof chart.addSeries === 'function') {
            instances.signalLineSeries = chart.addSeries(LineSeries, signalLineOptions);
        } else {
            // 古いバージョンの場合
            // @ts-ignore
            instances.signalLineSeries = chart.addLineSeries(signalLineOptions);
        }
        console.log("Signal Line Series Created on Pane:", paneIndex);
    } else {
        instances.signalLineSeries.applyOptions(signalLineOptions);
    }
    // 重複データを排除し昇順ソートしてからセット
    // NaN値をフィルタリング
    const sortedSignalLine = filterValidData(dedupAndSort(macdData.signalLine));
    instances.signalLineSeries.setData(sortedSignalLine);

    // --- Histogram ---
    if (!instances.histogramSeries) {
        // v5.0.6では、addHistogramSeries()の代わりにaddSeries()を使用
        if (typeof chart.addSeries === 'function') {
            instances.histogramSeries = chart.addSeries(HistogramSeries, histogramOptions);
        } else {
            // 古いバージョンの場合
            // @ts-ignore
            instances.histogramSeries = chart.addHistogramSeries(histogramOptions);
        }
        console.log("Histogram Series Created on Pane:", paneIndex);
    } else {
        instances.histogramSeries.applyOptions(histogramOptions);
    }
    // 重複データを排除し昇順ソートしてからセット
    // NaN値をフィルタリング
    const sortedHistogram = filterValidData(dedupAndSort(macdData.histogramData));
    instances.histogramSeries.setData(sortedHistogram);

    // --- Optional: Add Zero Line for Reference ---
    // This requires managing the line, potentially adding/removing it
    // Example (simplified, needs more robust handling):
    /*
    const zeroLineId = `macd_zero_line_${paneIndex}`;
    let zeroLine = instances.histogramSeries.priceLines().find(line => line.options().id === zeroLineId);
    if (!zeroLine) {
       instances.histogramSeries.createPriceLine({
            // id: zeroLineId, // Setting ID might require internal library access or different approach
            price: 0,
            color: '#787B86', // Grey color for zero line
            lineWidth: 1 as const,
            lineStyle: LineStyle.Dotted,
            axisLabelVisible: false, // Usually hide axis label for zero line
       });
    }
    */

    // Ensure the price scale exists and apply common options (ignore errors if scale not found)
    try {
        chart.priceScale(scaleId).applyOptions({
            scaleMargins: { top: 0.2, bottom: 0.2 },
            autoScale: true,
            entireTextOnly: true,
            borderVisible: false,
            textColor: '#9598A1',
        });
    } catch (err) {
        console.warn('MACD price scale not found, skipping applyOptions:', err);
    }
    console.log("MACD Series Updated/Set on Pane:", paneIndex);
}

/**
 * Removes all MACD series from the chart.
 * @param chart - The IChartApi instance.
 * @param seriesInstancesRef - Ref object holding the MACD series instances.
 */
export function removeMacdSeries(
    chart: IChartApi,
    seriesInstancesRef: React.MutableRefObject<MacdSeriesInstances>
) {
    if (!chart || !seriesInstancesRef || !seriesInstancesRef.current) return;

    const instances = seriesInstancesRef.current;

    // 安全な削除ユーティリティを使用して例外を回避
    safeRemoveSeries(chart, instances.macdLineSeries);
    instances.macdLineSeries = null;
    
    safeRemoveSeries(chart, instances.signalLineSeries);
    instances.signalLineSeries = null;
    
    safeRemoveSeries(chart, instances.histogramSeries);
    instances.histogramSeries = null;
    
    // 処理完了をログ
    console.log("MACD Series successfully removed");
    console.log("MACD Series Removed");
}
