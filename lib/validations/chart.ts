import { z } from "zod"
import { Timeframe } from "@/types/chart"

// OHLCデータのバリデーションスキーマ
export const ohlcDataSchema = z.object({
  time: z.union([
    z.number(),                 // UNIXタイムスタンプ（秒またはミリ秒）
    z.date(),                   // JavaScript Dateオブジェクト
    z.string().datetime()       // ISO形式の日時文字列
  ]),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number().optional()
})

// タイムフレームのバリデーションスキーマ
export const timeframeSchema = z.enum([
  "1m", "3m", "5m", "15m", "30m", 
  "1h", "2h", "4h", "6h", "8h", "12h", 
  "1d", "3d", "1w", "1M"
])

// チャートデータストア状態のバリデーションスキーマ
export const chartDataStateSchema = z.object({
  data: z.array(ohlcDataSchema),
  isLoading: z.boolean(),
  error: z.string().nullable(),
  currentSymbol: z.string(),
  currentTimeFrame: timeframeSchema,
  _abortController: z.any().nullable()
})

// チャートデータストアアクションのバリデーションスキーマ
export const chartDataActionsSchema = z.object({
  fetchData: z.function()
    .args(z.string(), timeframeSchema, z.any().optional())
    .returns(z.promise(z.array(ohlcDataSchema))),
  updateData: z.function()
    .args(ohlcDataSchema)
    .returns(z.void()),
  updateTimeFrame: z.function()
    .args(timeframeSchema)
    .returns(z.promise(z.void())),
  updateSymbol: z.function()
    .args(z.string())
    .returns(z.promise(z.void())),
  updateLastCandle: z.function()
    .args(ohlcDataSchema)
    .returns(z.void())
})

// 型定義のエクスポート
export type OHLCDataSchema = z.infer<typeof ohlcDataSchema>
export type TimeframeSchema = z.infer<typeof timeframeSchema>
export type ChartDataStateSchema = z.infer<typeof chartDataStateSchema>

// バリデーション関数
export function validateOHLCData(data: unknown) {
  return ohlcDataSchema.safeParse(data)
}

export function validateTimeframe(timeframe: unknown) {
  return timeframeSchema.safeParse(timeframe)
}

export function validateChartDataState(state: unknown) {
  return chartDataStateSchema.safeParse(state)
}