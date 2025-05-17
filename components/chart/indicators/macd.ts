// components/chart/indicators/macd.ts
// 作成: MACDインジケーターの実装
// 更新: lightweight-charts v5.0.6に対応
// 更新: 共通インターフェースに準拠し、型安全性を向上
// 更新: ChartIndicatorインターフェースを実装し、ファクトリー関数で使用可能に

import {
    IChartApi,
    ISeriesApi,
    LineData,
    LineStyle,
    Time,
    UTCTimestamp,
    HistogramData,
    LineSeries,
    HistogramSeries,
    LineWidth,
    DeepPartial
} from 'lightweight-charts';
import { MACD as MacdIndicator } from 'technicalindicators';
import { dedupAndSort } from '@/utils/chart/chartUtils';
import { 
    filterValidData, 
    createCompatibleSeries, 
    safeRemoveSeries, 
    extractPrices,
    sortAndPrepareData,
    convertLineData,
    convertHistogramData
} from '@/utils/chart/chartIndicatorUtils';
import type { OHLCData } from '@/types/chart';
import { logger } from '@/utils/common';
import type { MACDParams, ChartIndicator, IndicatorSeriesRefs } from '@/types/indicators';
import { createIndicator, registerIndicator } from '@/utils/chart/indicatorFactory';
import { registerIndicatorPlugin } from '../plugins/indicatorRegistry';
import type { IndicatorPlugin } from '../plugins/types';
import { MutableRefObject } from 'react';

/**
 * MACDの計算結果の型定義
 */
interface MacdValue {
    MACD?: number;
    signal?: number;
    histogram?: number;
}

/**
 * チャート表示用のMACDデータ
 */
interface MacdData {
    macdLine: LineData<Time>[];
    signalLine: LineData<Time>[];
    histogramData: HistogramData<Time>[];
}

/**
 * MACDシリーズの参照を管理するオブジェクト
 */
export interface MacdSeriesRefs {
    macdLine: MutableRefObject<ISeriesApi<'Line'> | null>;
    signalLine: MutableRefObject<ISeriesApi<'Line'> | null>;
    histogram: MutableRefObject<ISeriesApi<'Histogram'> | null>;
}

/**
 * MACDを計算する関数
 * @param ohlcData OHLCデータの配列
 * @param params MACDパラメータ
 * @returns MACD値の配列
 */
export function calculateMacdValues(
    ohlcData: OHLCData[],
    params: MACDParams
): MacdValue[] {
    // 終値からMACDを計算
    const prices = extractPrices(ohlcData, 'close');
    
    if (prices.length < Math.max(params.fastPeriod, params.slowPeriod) + params.signalPeriod) {
        return []; // Not enough data to calculate MACD
    }

    // technicalindicatorsライブラリを使用してMACDを計算
    return MacdIndicator.calculate({
        values: prices,
        fastPeriod: params.fastPeriod,
        slowPeriod: params.slowPeriod,
        signalPeriod: params.signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    });
}

/**
 * MACDデータをチャートデータ形式に変換する
 * @param macdValues MACD値の配列
 * @param ohlcData OHLCデータの配列
 * @param params MACDパラメータ
 * @returns チャート用にLineData形式に変換されたMACDデータ
 */
export function alignMacdData(
    macdValues: MacdValue[],
    ohlcData: OHLCData[],
    params: MACDParams
): MacdData {
    // 空のデータの場合は早期リターン
    if (macdValues.length === 0 || ohlcData.length === 0) {
        return {
            macdLine: [],
            signalLine: [],
            histogramData: []
        };
    }
    
    // --- MACD と OHLC データの長さ整合を取る ---
    // technicalindicators の MACD 計算結果は通常、原データより短くなります。
    // 差分は slowPeriod + signalPeriod 付近ですが実際のライブラリ実装に依存するため
    // 長さ差分から動的に開始インデックスを決定します。

    const startIndex = ohlcData.length - macdValues.length;
    if (startIndex < 0) {
        logger.warn('MACD: Computed values longer than source data. Abort align.', {
          component: 'MACD',
          action: 'alignIndicatorData',
          macdValuesLength: macdValues.length,
          ohlcDataLength: ohlcData.length
        });
        return { macdLine: [], signalLine: [], histogramData: [] };
    }

    const relevantData = ohlcData.slice(startIndex);

    const minLen = Math.min(relevantData.length, macdValues.length);

    // MACDの値と時間データをマッピング
    const macdLine: LineData<Time>[] = [];
    const signalLine: LineData<Time>[] = [];
    const histogramData: HistogramData<Time>[] = [];

    for (let i = 0; i < minLen; i++) {
        const timePoint = relevantData[i].time as Time;
        const macdValue = macdValues[i];
        
        if (macdValue.MACD !== undefined) {
            macdLine.push({
                time: timePoint,
                value: macdValue.MACD
            } as LineData<Time>);
        }

        if (macdValue.signal !== undefined) {
            signalLine.push({
                time: timePoint,
                value: macdValue.signal
            } as LineData<Time>);
        }

        if (macdValue.histogram !== undefined) {
            histogramData.push({
                time: timePoint,
                value: macdValue.histogram,
                color: macdValue.histogram >= 0 ? '#26A69A' : '#EF5350' // 正の値は緑、負の値は赤
            } as HistogramData<Time>);
        }
    }

    // NaN値をフィルタリング
    return {
        macdLine: filterValidData(macdLine),
        signalLine: filterValidData(signalLine),
        histogramData: filterValidData(histogramData)
    };
}

/**
 * MACDシリーズをチャートに追加または更新する
 * @param chart チャートインスタンス
 * @param macdData MACDデータ
 * @param params MACDパラメータ
 * @param seriesRefs MACDシリーズの参照
 */
export function addOrUpdateMacdSeries(
    chart: IChartApi,
    macdData: MacdData,
    params: MACDParams,
    seriesRefs: MacdSeriesRefs
): void {
    if (!chart) return;

    logger.info('MACDシリーズを追加/更新します', {
      component: 'MACD',
      action: 'addOrUpdate',
      paneIndex: params.paneIndex
    });

    // MACD Line options
    const macdLineOptions = {
        color: '#2962FF', // Blue color for MACD line
        lineWidth: 1 as LineWidth,
        title: 'MACD',
        priceScaleId: 'right',
        lastValueVisible: true,
    };

    // Signal Line options
    const signalLineOptions = {
        color: '#FF6D00', // Orange color for signal line
        lineWidth: 1 as LineWidth,
        title: 'Signal',
        priceScaleId: 'right',
        lastValueVisible: true,
    };

    // Histogram options
    const histogramOptions = {
        color: '#26A69A', // Green color for positive histogram
        priceFormat: {
            type: 'price' as const,
            precision: 4,
            minMove: 0.0001,
        },
        title: 'Histogram',
        priceScaleId: 'right',
        lastValueVisible: true,
    };

    // プライススケールの設定
    try {
        // プライススケールにオプションを適用
        chart.priceScale('right').applyOptions({
            scaleMargins: {
                top: 0.2,
                bottom: 0.2,
            },
            borderVisible: false
        });
    } catch (error) {
        logger.error('Error applying price scale options', error, {
          component: 'MACD',
          action: 'addOrUpdate',
          paneIndex: params.paneIndex
        });
    }

    // --- MACD Line ---
    if (!seriesRefs.macdLine.current) {
        // 共通ユーティリティを使用してシリーズを作成
        // v5.0.6では第3引数にパネルインデックスを指定できる
        if (typeof chart.addSeries === 'function') {
            // 新しいAPI (v5.0.6)
            // パネルインデックスを明示的に指定
            const macdOptions = {
                ...macdLineOptions,
                pane: params.paneIndex,
                overlay: false  // オーバーレイではなく個別のペインに表示
            };
            seriesRefs.macdLine.current = chart.addSeries(LineSeries, macdOptions, params.paneIndex) as ISeriesApi<'Line'>;
            logger.debug('MACDラインオプション', {
              component: 'MACD',
              action: 'createMacdLineSeries',
              options: macdOptions
            });
        } else {
            // 古いAPIの場合は元のユーティリティを使用
            seriesRefs.macdLine.current = createCompatibleSeries(chart, LineSeries, macdLineOptions);
        }
        logger.debug('MACD Line Series Created on Pane', {
          component: 'MACD',
          action: 'createMacdLineSeries',
          paneIndex: params.paneIndex
        });
    } else {
        // パネルインデックスを明示的に指定して更新
        const macdOptions = {
            ...macdLineOptions,
            pane: params.paneIndex,
            overlay: false
        };
        seriesRefs.macdLine.current.applyOptions(macdOptions);
    }
    
    // --- MACD Line ---
    const sortedMacdLine = sortAndPrepareData(macdData.macdLine);
    if (seriesRefs.macdLine.current) {
        logger.debug('MACD Line データをセット', {
          component: 'MACD',
          action: 'setMacdLineData',
          sampleData: sortedMacdLine.slice(0, 3)
        });
        // 新しい型変換ユーティリティを使用して型安全に変換
        seriesRefs.macdLine.current.setData(convertLineData(sortedMacdLine));
    }

    // --- Signal Line ---
    if (!seriesRefs.signalLine.current) {
        // v5.0.6では第3引数にパネルインデックスを指定できる
        if (typeof chart.addSeries === 'function') {
            // 新しいAPI (v5.0.6)
            // パネルインデックスを明示的に指定
            const signalOptions = {
                ...signalLineOptions,
                pane: params.paneIndex,
                overlay: false
            };
            seriesRefs.signalLine.current = chart.addSeries(LineSeries, signalOptions, params.paneIndex) as ISeriesApi<'Line'>;
            logger.debug('シグナルラインオプション', {
              component: 'MACD',
              action: 'createSignalLineSeries',
              options: signalOptions
            });
        } else {
            // 古いAPIの場合は元のユーティリティを使用
            seriesRefs.signalLine.current = createCompatibleSeries(chart, LineSeries, signalLineOptions);
        }
        logger.debug('Signal Line Series Created on Pane', {
          component: 'MACD',
          action: 'createSignalLineSeries',
          paneIndex: params.paneIndex
        });
    } else {
        // パネルインデックスを明示的に指定して更新
        const signalOptions = {
            ...signalLineOptions,
            pane: params.paneIndex,
            overlay: false
        };
        seriesRefs.signalLine.current.applyOptions(signalOptions);
    }
    
    // 重複データを排除し昇順ソートしてからセット
    const sortedSignalLine = sortAndPrepareData(macdData.signalLine);
    if (seriesRefs.signalLine.current) {
        logger.debug('Signal Line データをセット', {
          component: 'MACD',
          action: 'setSignalLineData',
          sampleData: sortedSignalLine.slice(0, 3)
        });
        // 新しい型変換ユーティリティを使用して型安全に変換
        seriesRefs.signalLine.current.setData(convertLineData(sortedSignalLine));
    }

    // --- Histogram ---
    if (!seriesRefs.histogram.current) {
        // v5.0.6では第3引数にパネルインデックスを指定できる
        if (typeof chart.addSeries === 'function') {
            // 新しいAPI (v5.0.6)
            // パネルインデックスを明示的に指定
            const histOptions = {
                ...histogramOptions,
                pane: params.paneIndex,
                overlay: false  // オーバーレイではなく個別のペインに表示
            };
            seriesRefs.histogram.current = chart.addSeries(HistogramSeries, histOptions, params.paneIndex) as ISeriesApi<'Histogram'>;
            logger.debug('ヒストグラムオプション', {
              component: 'MACD',
              action: 'createHistogramSeries',
              options: histOptions
            });
        } else {
            // 古いAPIの場合は元のユーティリティを使用
            seriesRefs.histogram.current = createCompatibleSeries(chart, HistogramSeries, histogramOptions);
        }
        logger.debug('Histogram Series Created on Pane', {
          component: 'MACD',
          action: 'createHistogramSeries',
          paneIndex: params.paneIndex
        });
    } else {
        // パネルインデックスを明示的に指定して更新
        const histOptions = {
            ...histogramOptions,
            pane: params.paneIndex,
            overlay: false
        };
        seriesRefs.histogram.current.applyOptions(histOptions);
    }
    
    // 重複データを排除し昇順ソートしてからセット
    const sortedHistogram = sortAndPrepareData(macdData.histogramData);
    if (seriesRefs.histogram.current) {
        logger.debug('Histogram データをセット', {
          component: 'MACD',
          action: 'setHistogramData',
          sampleData: sortedHistogram.slice(0, 3)
        });
        // 新しい型変換ユーティリティを使用して型安全に変換
        seriesRefs.histogram.current.setData(convertHistogramData(sortedHistogram));
    }

    // --- Optional: Add Zero Line for Reference ---
    // This requires managing the line, potentially adding/removing it
    // Example (simplified, needs more robust handling):
    // const zeroLineId = `macd_zero_line_${params.paneIndex}`;
    // let zeroLine = seriesRefs.histogram.current.priceLines().find(line => line.options().id === zeroLineId);
    // if (!zeroLine) {
    //     seriesRefs.histogram.current.createPriceLine({
    //         // id: zeroLineId, // Setting ID might require internal library access or different approach
    //         price: 0,
    //         color: '#787B86', // Grey color for zero line
    //         lineWidth: 1,
    //         lineStyle: LineStyle.Dotted,
    //         axisLabelVisible: false, // Usually hide axis label for zero line
    //     });
    // }
}

/**
 * MACDをチャートから削除する
 * @param chart チャートインスタンス
 * @param seriesRefs シリーズ参照
 */
export function removeMacdSeries(chart: IChartApi, seriesRefs: MacdSeriesRefs): void {
    if (!chart) return;

    logger.info('MACDシリーズを削除します', {
      component: 'MACD',
      action: 'remove'
    });

    // MACD Lineを削除
    safeRemoveSeries(chart, seriesRefs.macdLine.current);
    seriesRefs.macdLine.current = null;

    // Signal Lineを削除
    safeRemoveSeries(chart, seriesRefs.signalLine.current);
    seriesRefs.signalLine.current = null;

    // Histogramを削除
    safeRemoveSeries(chart, seriesRefs.histogram.current);
    seriesRefs.histogram.current = null;
}

/**
 * MACDインジケーターの実装
 * ChartIndicatorインターフェースに準拠
 */

// 計算関数: OHLCデータからMACD値を計算
// ChartIndicatorインターフェースのcalculateメソッドに対応
function calculateMacdForIndicator(data: OHLCData[], params: MACDParams): MacdData {
    // MACD値を計算
    const macdValues = calculateMacdValues(data, params);
    
    // チャートデータ形式に変換
    return alignMacdData(macdValues, data, params);
}

// 追加/更新関数: MACDをチャートに追加または更新
// ChartIndicatorインターフェースのaddOrUpdateメソッドに対応
function addOrUpdateMacdForIndicator(
    chart: IChartApi,
    macdData: MacdData,
    params: MACDParams,
    seriesRefs: IndicatorSeriesRefs
): void {
    // MacdSeriesRefs型に変換
    const macdSeriesRefs: MacdSeriesRefs = {
        macdLine: seriesRefs.macdLine as MutableRefObject<ISeriesApi<'Line'> | null>,
        signalLine: seriesRefs.signalLine as MutableRefObject<ISeriesApi<'Line'> | null>,
        histogram: seriesRefs.histogram as MutableRefObject<ISeriesApi<'Histogram'> | null>
    };
    
    // チャートに追加または更新
    addOrUpdateMacdSeries(chart, macdData, params, macdSeriesRefs);
}

// 削除関数: MACDをチャートから削除
// ChartIndicatorインターフェースのremoveメソッドに対応
function removeMacdForIndicator(
    chart: IChartApi,
    seriesRefs: IndicatorSeriesRefs
): void {
    // MacdSeriesRefs型に変換
    const macdSeriesRefs: MacdSeriesRefs = {
        macdLine: seriesRefs.macdLine as MutableRefObject<ISeriesApi<'Line'> | null>,
        signalLine: seriesRefs.signalLine as MutableRefObject<ISeriesApi<'Line'> | null>,
        histogram: seriesRefs.histogram as MutableRefObject<ISeriesApi<'Histogram'> | null>
    };
    
    // チャートから削除
    removeMacdSeries(chart, macdSeriesRefs);
}

// ChartIndicatorインターフェースを実装したMACDインジケーターを作成
const macdIndicator = createIndicator<MACDParams>(
    calculateMacdForIndicator,
    addOrUpdateMacdForIndicator,
    removeMacdForIndicator
);

// レジストリに登録
registerIndicator('macd', macdIndicator);

const macdPlugin: IndicatorPlugin<MACDParams> = {
  id: 'macd',
  calculate: calculateMacdForIndicator,
  addOrUpdate: addOrUpdateMacdForIndicator,
  remove: removeMacdForIndicator,
};

registerIndicatorPlugin(macdPlugin);

/**
 * 後方互換性のためのエクスポート
 * 当面は既存のインターフェースを維持
 */
export const MACD = {
    /**
     * OHLCデータからMACDを計算し、チャートに表示する
     * @param chart チャートインスタンス
     * @param data OHLCデータ
     * @param params MACDパラメータ
     * @param seriesRefs シリーズ参照
     */
    addOrUpdate: (chart: IChartApi, data: OHLCData[], params: MACDParams, seriesRefs: MacdSeriesRefs) => {
        if (!chart || !data || data.length === 0) return;
        
        // ファクトリー関数で作成したインジケーターを使用
        const macdData = calculateMacdForIndicator(data, params);
        addOrUpdateMacdSeries(chart, macdData, params, seriesRefs);
    },
    
    /**
     * MACDをチャートから削除する
     * @param chart チャートインスタンス
     * @param seriesRefs シリーズ参照
     */
  remove: (chart: IChartApi, seriesRefs: MacdSeriesRefs) => {
        removeMacdSeries(chart, seriesRefs);
    }
};

export { macdPlugin as MACDPlugin };
