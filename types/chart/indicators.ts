// types/chart/indicators.ts
// チャートインジケーター関連の型定義

import { IChartApi, ISeriesApi, LineData } from 'lightweight-charts';
import { MutableRefObject } from 'react';
import { OHLCData } from './data';
import { Time } from './time';

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
 * 一目均衡表の設定オプション
 */
export interface IchimokuOptions {
  tenkan?: number;   // 転換線の期間 (デフォルト: 9)
  kijun?: number;    // 基準線の期間 (デフォルト: 26)
  senkou?: number;   // 先行スパンBの期間 (デフォルト: 52)
}

/**
 * フィボナッチリトレースメントの方向
 */
export type FibonacciDirection = 'up' | 'down';

/**
 * フィボナッチリトレースメントの設定オプション
 */
export interface FibonacciOptions {
  startPrice: number;      // 開始価格（高値または安値）
  endPrice: number;        // 終了価格（安値または高値）
  direction: FibonacciDirection; // リトレースメントの方向
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