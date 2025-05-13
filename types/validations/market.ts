// lib/validations/market.ts
// 作成: 市場データ関連のZodバリデーションスキーマ

import { z } from "zod"
import { ExchangeType } from "@/types/api"

// OrderBookEntry（注文エントリー）のバリデーションスキーマ
export const orderBookEntrySchema = z.object({
  price: z.number().positive(),
  amount: z.number().positive(),
  total: z.number().positive().optional() // UI表示用の累積数量
})

// 板データの配列形式のスキーマ（[string, string]）
export const depthTupleSchema = z.tuple([
  z.string(), // price
  z.string()  // amount/size
])

// OrderBookData（オーダーブック全体）のバリデーションスキーマ
export const orderBookDataSchema = z.object({
  symbol: z.string().min(1),
  timestamp: z.number().int().positive(),
  // 配列形式([string, string][])またはオブジェクト形式(OrderBookEntry[])を許可
  bids: z.union([
    z.array(orderBookEntrySchema), 
    z.array(depthTupleSchema)
  ]),
  asks: z.union([
    z.array(orderBookEntrySchema), 
    z.array(depthTupleSchema)
  ])
})

// OrderBookProps（コンポーネントのプロパティ）のバリデーションスキーマ
export const orderBookPropsSchema = z.object({
  depth: z.number().int().positive().optional().default(15), // 表示する深さ
  className: z.string().optional(),
  orderBookWidth: z.union([z.number().positive(), z.string()]).optional().default('33%') // 表示幅
})

// TradeDirection（取引方向）のバリデーションスキーマ
export const tradeDirectionSchema = z.enum(["buy", "sell"])

// TradeData（取引データ）のバリデーションスキーマ
export const tradeDataSchema = z.object({
  id: z.string(),
  symbol: z.string().min(1),
  price: z.number().positive(),
  amount: z.number().positive(),
  timestamp: z.number().int().positive(),
  direction: tradeDirectionSchema
})

// MarketStatsData（市場統計データ）のバリデーションスキーマ
export const marketStatsDataSchema = z.object({
  symbol: z.string().min(1),
  high24h: z.number().positive(),
  low24h: z.number().positive(),
  volume24h: z.number().positive(),
  priceChangePercent24h: z.number(),
  lastPrice: z.number().positive(),
  timestamp: z.number().int().positive()
})

// SymbolInfo（銘柄情報）のバリデーションスキーマ
export const symbolInfoSchema = z.object({
  symbol: z.string().min(1),
  baseCoin: z.string().min(1),
  quoteCoin: z.string().min(1),
  minOrderSize: z.number().positive(),
  pricePrecision: z.number().int().nonnegative(),
  quantityPrecision: z.number().int().nonnegative(),
  status: z.string(), // 'online' | 'offline' などの状態
  exchangeType: z.enum(['spot', 'futures'])
})

// BitgetOrderBookResponse（API レスポンス）のバリデーションスキーマ
export const bitgetOrderBookResponseSchema = z.object({
  code: z.string(),
  data: z.object({
    asks: z.array(z.array(z.string())),
    bids: z.array(z.array(z.string())),
    timestamp: z.string()
  }),
  msg: z.string()
})

// BitgetTradesResponse（API レスポンス）のバリデーションスキーマ
export const bitgetTradesResponseSchema = z.object({
  code: z.string(),
  data: z.object({
    items: z.array(z.object({
      price: z.string(),
      side: z.string(),
      size: z.string(),
      timestamp: z.string(),
      tradeId: z.string()
    }))
  }),
  msg: z.string()
})

// BitgetTickerResponse（API レスポンス）のバリデーションスキーマ
export const bitgetTickerResponseSchema = z.object({
  code: z.string(),
  data: z.array(z.object({
    high24h: z.string(),
    low24h: z.string(),
    volume24h: z.string(),
    priceChangePercent24h: z.string(),
    lastPr: z.string(),
    ts: z.string()
  })),
  msg: z.string()
})

// BitgetSymbolsResponse（API レスポンス）のバリデーションスキーマ
export const bitgetSymbolsResponseSchema = z.object({
  code: z.string(),
  data: z.array(z.object({
    symbol: z.string(),
    baseCoin: z.string(),
    quoteCoin: z.string(),
    minTradeAmount: z.string(),
    pricePrecision: z.string(),
    quantityPrecision: z.string(),
    status: z.string()
  })),
  msg: z.string()
})

// 型定義のエクスポート
export type OrderBookEntrySchema = z.infer<typeof orderBookEntrySchema>
export type OrderBookDataSchema = z.infer<typeof orderBookDataSchema>
export type OrderBookPropsSchema = z.infer<typeof orderBookPropsSchema>
export type TradeDirectionSchema = z.infer<typeof tradeDirectionSchema>
export type TradeDataSchema = z.infer<typeof tradeDataSchema>
export type MarketStatsDataSchema = z.infer<typeof marketStatsDataSchema>
export type SymbolInfoSchema = z.infer<typeof symbolInfoSchema>
export type BitgetOrderBookResponseSchema = z.infer<typeof bitgetOrderBookResponseSchema>
export type BitgetTradesResponseSchema = z.infer<typeof bitgetTradesResponseSchema>
export type BitgetTickerResponseSchema = z.infer<typeof bitgetTickerResponseSchema>
export type BitgetSymbolsResponseSchema = z.infer<typeof bitgetSymbolsResponseSchema>

// バリデーション関数
export function validateOrderBookEntry(data: unknown) {
  return orderBookEntrySchema.safeParse(data)
}

export function validateOrderBookData(data: unknown) {
  return orderBookDataSchema.safeParse(data)
}

export function validateOrderBookProps(data: unknown) {
  return orderBookPropsSchema.safeParse(data)
}

export function validateTradeData(data: unknown) {
  return tradeDataSchema.safeParse(data)
}

export function validateMarketStatsData(data: unknown) {
  return marketStatsDataSchema.safeParse(data)
}

export function validateSymbolInfo(data: unknown) {
  return symbolInfoSchema.safeParse(data)
}

export function validateBitgetOrderBookResponse(data: unknown) {
  return bitgetOrderBookResponseSchema.safeParse(data)
}

export function validateBitgetTradesResponse(data: unknown) {
  return bitgetTradesResponseSchema.safeParse(data)
}

export function validateBitgetTickerResponse(data: unknown) {
  return bitgetTickerResponseSchema.safeParse(data)
}

export function validateBitgetSymbolsResponse(data: unknown) {
  return bitgetSymbolsResponseSchema.safeParse(data)
}