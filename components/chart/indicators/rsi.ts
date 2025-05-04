// Logic for calculating and displaying RSI
import {
  IChartApi,
  ISeriesApi,
  LineData,
  LineStyle,
  Time,
  createChart,
  LineSeries,
} from 'lightweight-charts';
import { 
  filterValidData, 
  createCompatibleSeries, 
  safeRemoveSeries,
  extractPrices,
  convertToLineData 
} from '@/utils/chartIndicatorUtils';
import type { OHLCData } from '@/types/chart';
import type { RSIParams } from '@/types/indicators';
import { RSI as RsiIndicator } from 'technicalindicators';
import { MutableRefObject } from 'react';

/**
 * RSIデータを計算する関数
 * @param ohlcData OHLCデータの配列
 * @param params RSIパラメータ
 * @returns RSIの計算結果を含むLineData配列
 */
export function calculateRsiData(
  ohlcData: OHLCData[],
  params: RSIParams
): LineData<Time>[] {
  if (ohlcData.length < params.period) {
    return []; // Not enough data to calculate RSI
  }

  // 終値からRSIを計算
  const prices = extractPrices(ohlcData, 'close');
  const rsiValues = RsiIndicator.calculate({ values: prices, period: params.period });

  // RSI計算の結果は入力データより(period - 1)短くなる
  // 時間データと合わせる必要がある
  const rsiLineData: LineData[] = rsiValues.map((value, index) => ({
    time: ohlcData[index + (params.period - 1)].time as Time,
    value: value
  }));
  
  // NaN値をフィルタリング
  return filterValidData(rsiLineData);
}

/**
 * RSIシリーズをチャートに追加または更新する
 * @param chart チャートインスタンス
 * @param rsiData RSIデータ
 * @param params RSIパラメータ
 * @param rsiSeriesRef RSIシリーズの参照
 */
export function addOrUpdateRsiSeries(
  chart: IChartApi,
  rsiData: LineData<Time>[],
  params: RSIParams,
  rsiSeriesRef: MutableRefObject<ISeriesApi<"Line"> | null>
): void {
  if (!chart) return;

  const rsiOptions = {
    color: '#2962FF',
    lineWidth: 1 as const,
    title: 'RSI',
    pane: params.paneIndex,
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

  if (!rsiSeriesRef.current) {
    // シリーズが存在しなければ作成
    if (typeof chart.addSeries === 'function') {
      // v5.0.6+ API
      const opts = { ...rsiOptions, overlay: false };
      rsiSeriesRef.current = chart.addSeries(LineSeries, opts, params.paneIndex) as ISeriesApi<'Line'>;
    } else {
      // 古いAPI
      rsiSeriesRef.current = createCompatibleSeries(chart, LineSeries, rsiOptions);
    }

    // Ensure the price scale is configured AFTER the series (and scale) is created
    rsiSeriesRef.current.priceScale().applyOptions({
        scaleMargins: {
            top: 0.1, // TradingView風のマージン調整
            bottom: 0.1,
        },
        autoScale: false, // RSIは固定スケール (0-100)
        entireTextOnly: true,
        borderVisible: false,
        textColor: '#9598A1', // テキスト色を薄く
    });

    if (rsiSeriesRef.current) {
      rsiSeriesRef.current.setData(rsiData);

      // オーバーボート/オーバーソールドラインをTradingView風に設定
      rsiSeriesRef.current.createPriceLine({
        price: params.overbought,
        color: '#FF6D00', // オレンジ色
        lineWidth: 1,
        lineStyle: 2, // 点線
        axisLabelVisible: true,
        title: 'Overbought',
    });

    rsiSeriesRef.current.createPriceLine({
        price: params.oversold,
        color: '#2962FF', // 青色
        lineWidth: 1,
        lineStyle: 2, // 点線
        axisLabelVisible: true,
        title: 'Oversold',
    });
    }
  } else {
    // 既存シリーズがあればデータ更新のみ
    rsiSeriesRef.current.setData(rsiData);
  }
}

/**
 * RSIインジケーターをチャートから削除する
 * @param chart チャートインスタンス
 * @param rsiSeriesRef RSIシリーズの参照
 */
export function removeRsiSeries(
  chart: IChartApi,
  rsiSeriesRef: MutableRefObject<ISeriesApi<"Line"> | null>
): void {
  safeRemoveSeries(chart, rsiSeriesRef.current);
  if (rsiSeriesRef.current) {
    rsiSeriesRef.current = null;
  }
}

/**
 * RSIインジケーターのエクスポート関数
 * チャートキャンバスから使用されるインターフェース
 */
export const RSI = {
  /**
   * OHLCデータからRSIを計算し、チャートに表示する
   * @param chart チャートインスタンス
   * @param data OHLCデータ
   * @param params RSIパラメータ
   * @param seriesRef シリーズ参照
   */
  addOrUpdate: (chart: IChartApi, data: OHLCData[], params: RSIParams, seriesRef: MutableRefObject<ISeriesApi<"Line"> | null>) => {
    if (!chart || !data || data.length === 0) return;
    
    // RSIを計算
    const rsiData = calculateRsiData(data, params);
    
    // チャートに追加または更新
    addOrUpdateRsiSeries(chart, rsiData, params, seriesRef);
  },
  
  /**
   * RSIをチャートから削除する
   * @param chart チャートインスタンス
   * @param seriesRef シリーズ参照
   */
  remove: (chart: IChartApi, seriesRef: MutableRefObject<ISeriesApi<"Line"> | null>) => {
    removeRsiSeries(chart, seriesRef);
  }
};
