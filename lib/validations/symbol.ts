// lib/validations/symbol.ts
// 作成: シンボルセレクター関連のZodバリデーションスキーマ
// 更新: 2025-10-09 - S-9.2フェーズ: ExchangeType型の参照を統一

import { z } from "zod"
import { type ExchangeType, type ExchangeProductType } from "@/types/constants/enums"
import { safeExchangeType, safeProductType } from "@/utils/exchangeTypeUtils";

// シンボル情報のバリデーションスキーマ
export const symbolInfoSchema = z.object({
  symbol: z.string().min(1),
  baseAsset: z.string().min(1),
  quoteCoin: z.string().min(1),
  displayName: z.string().optional(),
  pricePrecision: z.number().int().nonnegative(),
  quantityPrecision: z.number().int().nonnegative(),
  minNotional: z.union([z.string(), z.number()]),
  status: z.string(),
  favorite: z.boolean().optional()
})

// フィルターオプションのバリデーションスキーマ
export const filterOptionsSchema = z.object({
  search: z.string().default(""),
  quoteAsset: z.string().default(""),
  showFavoritesOnly: z.boolean().default(false)
})

// シンボルセレクターのプロパティのバリデーションスキーマ
export const symbolSelectorPropsSchema = z.object({
  onSelect: z.function()
    .args(z.string())
    .returns(z.void()),
  currentSymbol: z.string().default("BTCUSDT"),
  defaultExchangeType: z.enum(["bitget", "binance", "bybit", "demo"]).default("bitget"),
  onExchangeTypeChange: z.function()
    .args(z.enum(["bitget", "binance", "bybit", "demo"]))
    .returns(z.void())
    .optional()
})

// 型定義のエクスポート
export type SymbolInfoSchema = z.infer<typeof symbolInfoSchema>
export type FilterOptionsSchema = z.infer<typeof filterOptionsSchema>
export type SymbolSelectorPropsSchema = z.infer<typeof symbolSelectorPropsSchema>

// バリデーション関数
export function validateSymbolInfo(data: unknown) {
  return symbolInfoSchema.safeParse(data)
}

export function validateFilterOptions(data: unknown) {
  return filterOptionsSchema.safeParse(data)
}

export function validateSymbolSelectorProps(data: unknown) {
  return symbolSelectorPropsSchema.safeParse(data)
}