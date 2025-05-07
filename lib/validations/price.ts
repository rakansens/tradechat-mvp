import { z } from "zod"

// 価格表示用のバリデーションスキーマ
export const priceDisplaySchema = z.object({
  price: z.number(),
  symbol: z.string().optional(),
  showSymbol: z.boolean().optional().default(false),
  className: z.string().optional().default(""),
  size: z.enum(["sm", "md", "lg"]).optional().default("md")
})

// 価格変化表示用のバリデーションスキーマ
export const priceChangeSchema = z.object({
  changePercent: z.number(),
  className: z.string().optional().default(""),
  size: z.enum(["sm", "md", "lg"]).optional().default("md"),
  showPlusSign: z.boolean().optional().default(true)
})

// 型定義のエクスポート
export type PriceDisplayProps = z.infer<typeof priceDisplaySchema>
export type PriceChangeProps = z.infer<typeof priceChangeSchema>

// バリデーション関数
export function validatePriceDisplay(data: unknown) {
  return priceDisplaySchema.safeParse(data)
}

export function validatePriceChange(data: unknown) {
  return priceChangeSchema.safeParse(data)
}