// components/chart/indicators/bollingerBands.ts
// Implement Bollinger Bands indicator using lightweight-charts

import {
  IChartApi,
  ISeriesApi,
  LineData,
  Time,
  LineSeries,
} from 'lightweight-charts';
import { BollingerBands as BBIndicator } from 'technicalindicators';
import type { OHLCData } from '@/types/chart';
import type { BollingerParams, ChartIndicator, IndicatorSeriesRefs } from '@/types/indicators';
import {
  filterValidData,
  createCompatibleSeries,
  safeRemoveSeries,
  extractPrices,
  sortAndPrepareData,
  convertLineData,
} from '@/utils/chart/chartIndicatorUtils';
import { createIndicator, registerIndicator } from '@/utils/chart/indicatorFactory';
import { MutableRefObject } from 'react';

/** Bollinger Bands data formatted for chart display */
interface BollingerData {
  upper: LineData<Time>[];
  middle: LineData<Time>[];
  lower: LineData<Time>[];
}

/** References to Bollinger Band series */
export interface BollingerSeriesRefs {
  upper: MutableRefObject<ISeriesApi<'Line'> | null>;
  middle: MutableRefObject<ISeriesApi<'Line'> | null>;
  lower: MutableRefObject<ISeriesApi<'Line'> | null>;
}

/**
 * Calculate Bollinger Band values from OHLC data
 */
export function calculateBollingerData(
  ohlcData: OHLCData[],
  params: BollingerParams,
): BollingerData {
  if (ohlcData.length < params.period) {
    return { upper: [], middle: [], lower: [] };
  }

  const closes = extractPrices(ohlcData, 'close');
  const bbValues = BBIndicator.calculate({
    period: params.period,
    values: closes,
    stdDev: params.stdDev,
  });

  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];

  for (let i = 0; i < bbValues.length; i++) {
    const time = ohlcData[i + (params.period - 1)].time as Time;
    const val = bbValues[i];
    upper.push({ time, value: val.upper });
    middle.push({ time, value: val.middle });
    lower.push({ time, value: val.lower });
  }

  return {
    upper: filterValidData(upper),
    middle: filterValidData(middle),
    lower: filterValidData(lower),
  };
}

/**
 * Add or update Bollinger Bands series on the chart
 */
export function addOrUpdateBollingerSeries(
  chart: IChartApi,
  bbData: BollingerData,
  params: BollingerParams,
  seriesRefs: BollingerSeriesRefs,
): void {
  if (!chart) return;

  const upperOptions = {
    color: '#EF5350',
    lineWidth: 1 as const,
    title: 'BB Upper',
    pane: params.paneIndex,
    lastValueVisible: true,
  };
  const middleOptions = {
    color: '#888888',
    lineWidth: 1 as const,
    title: 'BB Middle',
    pane: params.paneIndex,
    lastValueVisible: true,
  };
  const lowerOptions = {
    color: '#26A69A',
    lineWidth: 1 as const,
    title: 'BB Lower',
    pane: params.paneIndex,
    lastValueVisible: true,
  };

  if (!seriesRefs.upper.current) {
    if (typeof chart.addSeries === 'function') {
      seriesRefs.upper.current = chart.addSeries(LineSeries, upperOptions, params.paneIndex) as ISeriesApi<'Line'>;
    } else {
      seriesRefs.upper.current = createCompatibleSeries(chart, LineSeries, upperOptions);
    }
  } else {
    seriesRefs.upper.current.applyOptions(upperOptions);
  }

  if (!seriesRefs.middle.current) {
    if (typeof chart.addSeries === 'function') {
      seriesRefs.middle.current = chart.addSeries(LineSeries, middleOptions, params.paneIndex) as ISeriesApi<'Line'>;
    } else {
      seriesRefs.middle.current = createCompatibleSeries(chart, LineSeries, middleOptions);
    }
  } else {
    seriesRefs.middle.current.applyOptions(middleOptions);
  }

  if (!seriesRefs.lower.current) {
    if (typeof chart.addSeries === 'function') {
      seriesRefs.lower.current = chart.addSeries(LineSeries, lowerOptions, params.paneIndex) as ISeriesApi<'Line'>;
    } else {
      seriesRefs.lower.current = createCompatibleSeries(chart, LineSeries, lowerOptions);
    }
  } else {
    seriesRefs.lower.current.applyOptions(lowerOptions);
  }

  const upperData = sortAndPrepareData(bbData.upper);
  const middleData = sortAndPrepareData(bbData.middle);
  const lowerData = sortAndPrepareData(bbData.lower);

  seriesRefs.upper.current?.setData(convertLineData(upperData));
  seriesRefs.middle.current?.setData(convertLineData(middleData));
  seriesRefs.lower.current?.setData(convertLineData(lowerData));
}

/** Remove Bollinger Band series from the chart */
export function removeBollingerSeries(
  chart: IChartApi,
  seriesRefs: BollingerSeriesRefs,
): void {
  safeRemoveSeries(chart, seriesRefs.upper.current);
  safeRemoveSeries(chart, seriesRefs.middle.current);
  safeRemoveSeries(chart, seriesRefs.lower.current);
  seriesRefs.upper.current = null;
  seriesRefs.middle.current = null;
  seriesRefs.lower.current = null;
}

// --- ChartIndicator implementation ---
function calculateForIndicator(data: OHLCData[], params: BollingerParams): BollingerData {
  return calculateBollingerData(data, params);
}

function addOrUpdateForIndicator(
  chart: IChartApi,
  data: BollingerData,
  params: BollingerParams,
  seriesRefs: IndicatorSeriesRefs,
): void {
  const refs: BollingerSeriesRefs = {
    upper: seriesRefs.upper as MutableRefObject<ISeriesApi<'Line'> | null>,
    middle: seriesRefs.middle as MutableRefObject<ISeriesApi<'Line'> | null>,
    lower: seriesRefs.lower as MutableRefObject<ISeriesApi<'Line'> | null>,
  };
  addOrUpdateBollingerSeries(chart, data, params, refs);
}

function removeForIndicator(
  chart: IChartApi,
  seriesRefs: IndicatorSeriesRefs,
): void {
  const refs: BollingerSeriesRefs = {
    upper: seriesRefs.upper as MutableRefObject<ISeriesApi<'Line'> | null>,
    middle: seriesRefs.middle as MutableRefObject<ISeriesApi<'Line'> | null>,
    lower: seriesRefs.lower as MutableRefObject<ISeriesApi<'Line'> | null>,
  };
  removeBollingerSeries(chart, refs);
}

const bollingerIndicator = createIndicator<BollingerParams>(
  calculateForIndicator,
  addOrUpdateForIndicator,
  removeForIndicator,
);

registerIndicator('bollinger', bollingerIndicator);

/** Backward-compatible exports */
export const BollingerBands = {
  addOrUpdate: (
    chart: IChartApi,
    data: OHLCData[],
    params: BollingerParams,
    seriesRefs: BollingerSeriesRefs,
  ) => {
    if (!chart || !data || data.length === 0) return;
    const bbData = calculateBollingerData(data, params);
    addOrUpdateBollingerSeries(chart, bbData, params, seriesRefs);
  },
  remove: (chart: IChartApi, seriesRefs: BollingerSeriesRefs) => {
    removeBollingerSeries(chart, seriesRefs);
  },
};

