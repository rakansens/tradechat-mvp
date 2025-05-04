// types/indicators.ts
// 作成: インジケーター関連の共通型定義
// 
// このファイルはチャートインジケーターに関する共通の型定義を提供します。
// 各インジケーターの実装はこれらのインターフェースに準拠することで一貫性を確保します。

import { IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { OHLCData } from './chart';
import { MutableRefObject } from 'react';

/**
 * インジケーターのパラメータ型（基本）
 */
export interface BaseIndicatorParams {
  visible: boolean;
  paneIndex?: number;
}

/**
 * RSIインジケーターのパラメータ
 */
export interface RSIParams extends BaseIndicatorParams {
  period: number;
  overbought: number;
  oversold: number;
}

/**
 * MACDインジケーターのパラメータ
 */
export interface MACDParams extends BaseIndicatorParams {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
}

/**
 * 一目均衡表のパラメータ
 */
export interface IchimokuParams extends BaseIndicatorParams {
  tenkanPeriod: number;
  kijunPeriod: number;
  senkouSpanBPeriod: number;
  displacement: number;
}

/**
 * ボリンジャーバンドのパラメータ
 */
export interface BollingerParams extends BaseIndicatorParams {
  period: number;
  stdDev: number;
}

/**
 * インジケーターシリーズの参照型
 * 各インジケーターの実装で使用するシリーズへの参照を管理
 */
export interface IndicatorSeriesRefs {
  [key: string]: MutableRefObject<ISeriesApi<any> | null>;
}

/**
 * インジケーターの基本インターフェース
 * すべてのインジケーターはこのインターフェースを実装する
 */
export interface ChartIndicator<T extends BaseIndicatorParams> {
  // インジケーターの計算
  calculate: (data: OHLCData[], params: T) => any;
  
  // チャートへの追加または更新
  addOrUpdate: (
    chart: IChartApi,
    data: any,
    params: T,
    seriesRefs: IndicatorSeriesRefs
  ) => void;
  
  // チャートからの削除
  remove: (
    chart: IChartApi,
    seriesRefs: IndicatorSeriesRefs
  ) => void;
}

/**
 * インジケーターデータの変換ユーティリティ型
 * OHLCデータから特定のインジケーターデータへの変換関数の型
 */
export type IndicatorDataTransformer<T, R> = (
  ohlcData: OHLCData[],
  params: T
) => R;
