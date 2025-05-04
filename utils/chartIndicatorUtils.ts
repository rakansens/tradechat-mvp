// utils/chartIndicatorUtils.ts
// 作成: チャートインジケーター関連の共通ユーティリティ関数
// 更新: 型安全性の向上と共通関数の追加
// 
// このファイルは以下のインジケーター関連の共通機能を提供します:
// - NaN値のフィルタリング
// - lightweight-charts v5.0.6 API対応のシリーズ作成関数
// - インジケーター間で共通して使用される関数
// - インジケーターの初期化・更新・削除の共通処理

import { IChartApi, LineSeries, AreaSeries, HistogramSeries, CandlestickSeries, ISeriesApi, SeriesType, Time, LineData } from 'lightweight-charts';
import { UTCTimestamp, ChartTimeCompatible } from '@/types/chart';
import type { OHLCData } from '@/types/chart';
import type { BaseIndicatorParams, IndicatorSeriesRefs } from '@/types/indicators';
import { dedupAndSort } from '@/utils/chartUtils';

/**
 * NaN値をフィルタリングし、有効なデータのみを返す
 * @param data チャートデータ配列
 * @returns NaN値を除外したデータ配列
 */
export function filterValidData<T extends { value: number }>(data: Array<T>): Array<T> {
  return data.filter(item => {
    // NaN値や無限大の値をフィルタリング
    return !isNaN(item.value) && isFinite(item.value);
  });
}

/**
 * バージョン互換性を持つシリーズ作成関数
 * lightweight-charts v5.0.6とそれ以前のバージョンの両方に対応
 * 
 * @param chart チャートインスタンス
 * @param seriesType シリーズタイプ（LineSeries, HistogramSeries, AreaSeries, CandlestickSeries）
 * @param options シリーズオプション
 * @returns 作成されたシリーズインスタンス
 */
export function createCompatibleSeries(chart: IChartApi, seriesType: any, options: any): any {
  if (typeof chart.addSeries === 'function') {
    // v5.0.6以降のAPI
    return chart.addSeries(seriesType, options);
  } else {
    // 古いバージョンのAPI
    if (seriesType === LineSeries) {
      // @ts-ignore - 古いバージョン対応
      return chart.addLineSeries(options);
    } else if (seriesType === HistogramSeries) {
      // @ts-ignore - 古いバージョン対応
      return chart.addHistogramSeries(options);
    } else if (seriesType === AreaSeries) {
      // @ts-ignore - 古いバージョン対応
      return chart.addAreaSeries(options);
    } else if (seriesType === CandlestickSeries) {
      // @ts-ignore - 古いバージョン対応
      return chart.addCandlestickSeries(options);
    }
    // デフォルトはラインシリーズ
    // @ts-ignore - 古いバージョン対応
    return chart.addLineSeries(options);
  }
}

/**
 * シリーズを安全に削除する
 * チャートとシリーズの両方が存在する場合のみ削除を実行
 * 
 * @param chart チャートインスタンス
 * @param series シリーズインスタンス
 * @returns 削除が成功したかどうか
 */
export function safeRemoveSeries(chart: IChartApi | null, series: any | null): boolean {
  if (!chart || !series) return false;
  
  try {
    chart.removeSeries(series);
    return true;
  } catch (error) {
    console.error('Failed to remove series:', error);
    return false;
  }
}

/**
 * インジケーターのシリーズを安全に削除する
 * 複数のシリーズを持つインジケーターに対応
 * 
 * @param chart チャートインスタンス
 * @param seriesRefs シリーズ参照オブジェクト
 * @returns 削除が成功したかどうか
 */
export function removeIndicatorSeries(chart: IChartApi | null, seriesRefs: IndicatorSeriesRefs): boolean {
  if (!chart) return false;
  
  let success = true;
  
  // 各シリーズを削除
  Object.values(seriesRefs).forEach(seriesRef => {
    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      } catch (error) {
        console.error('Failed to remove indicator series:', error);
        success = false;
      }
    }
  });
  
  return success;
}

/**
 * OHLCデータから特定の値（始値、高値、安値、終値）の配列を抽出する
 * @param data OHLCデータの配列
 * @param key 抽出するプロパティ名
 * @returns 抽出した値の配列
 */
export function extractPrices(
  data: OHLCData[],
  key: 'open' | 'high' | 'low' | 'close' = 'close'
): number[] {
  return data.map(candle => candle[key]);
}

/**
 * OHLCデータをLineData形式に変換する
 * @param data OHLCデータの配列
 * @param values 変換する値の配列
 * @returns LineData形式の配列
 */
export function convertToLineData(data: OHLCData[], values: number[]): LineData<Time>[] {
  return values.map((value, index) => ({
    time: data[index].time as Time,
    value: value
  }));
}

/**
 * データの重複排除、ソート、フィルタリングを一度に行う共通ユーティリティ
 * 各インジケーターで繰り返し使用されるデータ前処理を標準化
 * 
 * @param data 処理対象のデータ配列
 * @returns 重複排除・ソート・フィルタリング済みのデータ配列
 */
export function sortAndPrepareData<T extends { time: Time; value: number }>(data: T[]): T[] {
  // 1. 重複排除とソート
  const sortedData = dedupAndSort(data as unknown as { time: UTCTimestamp }[]) as unknown as T[];
  
  // 2. 無効なデータをフィルタリング
  return filterValidData(sortedData);
}

/**
 * LineData<Time>[] を lightweight‐charts が要求する形式に変換
 * 新しい ChartTimeCompatible 型を使用して型安全性を向上
 */
export function convertTimeSeriesData<T extends { time: Time; value: number }>(data: T[]): { time: ChartTimeCompatible; value: number }[] {
  // 型変換のみで実際のデータ構造は変わらない
  return data as unknown as { time: ChartTimeCompatible; value: number }[];
}

/**
 * ヒストグラムデータを変換する専用関数
 */
export function convertHistogramData<T extends { time: Time; value: number; color?: string }>(data: T[]): { time: ChartTimeCompatible; value: number; color?: string }[] {
  return data as unknown as { time: ChartTimeCompatible; value: number; color?: string }[];
}

export type { UTCTimestamp };
