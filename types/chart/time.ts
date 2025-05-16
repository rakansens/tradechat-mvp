// types/chart/time.ts
// チャートの時間関連の型定義
// 更新: T-7.3フェーズ - Timeframe型をenums.tsから参照

import { z } from "zod";
import { timeframeSchema } from "@/types/validations/chart";
import { Timeframe } from "@/types/constants/enums";

/**
 * Nominal 型（lightweight-charts の型定義から）
 * 基本型に名前付きの型タグを付与するためのユーティリティ型
 */
export type Nominal<T, Name extends string> = T & {
  readonly __nominal: Name;
};

/**
 * UTCTimestamp 型（lightweight-charts の型定義から）
 * Unix タイムスタンプを表す数値型
 */
export type UTCTimestamp = Nominal<number, "UTCTimestamp">;

/**
 * BusinessDay 型（lightweight-charts の型定義から）
 * 営業日を表すオブジェクト型
 */
export interface BusinessDay {
  year: number;
  month: number;
  day: number;
}

/**
 * Time 型（lightweight-charts の型定義から）
 * チャートの時間軸で使用される型
 */
export type Time = UTCTimestamp | BusinessDay | string;

/**
 * ChartTimeCompatible 型
 * lightweight-charts v5 と互換性のある時間型
 * インジケーターデータの型変換に使用
 */
export type ChartTimeCompatible = Time | number;

/**
 * チャートのタイムフレーム
 */
export type { Timeframe };

/**
 * ZodスキーマからのTimeframeの型
 */
export type TimeframeSchema = z.infer<typeof timeframeSchema>;

/**
 * チャートの表示タイプ
 */
export type ChartType = "candles" | "line" | "bar" | "area"; 