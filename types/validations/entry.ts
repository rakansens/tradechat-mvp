import { z } from "zod"

// エントリーのバリデーションスキーマ
export const entrySchema = z.object({
  id: z.string(),
  side: z.enum(["buy", "sell"]),
  symbol: z.string(),
  price: z.number().positive(),
  time: z.string().datetime(),
  status: z.enum(["open", "closed", "canceled"]).optional(),
  exitPrice: z.number().positive().optional(),
  exitTime: z.string().datetime().optional(),
  profit: z.number().optional(),
})

// エントリー作成用のスキーマ
export const createEntrySchema = z.object({
  side: z.enum(["buy", "sell"]),
  symbol: z.string(),
  price: z.number().positive(),
  takeProfitPrice: z.number().positive().optional(),
  stopLossPrice: z.number().positive().optional(),
})

// エントリー更新用のスキーマ
export const updateEntrySchema = z.object({
  id: z.string(),
  exitPrice: z.number().positive().optional(),
  status: z.enum(["open", "closed", "canceled"]).optional(),
})

// エントリー提案用のスキーマ
export const entryProposalSchema = z.object({
  side: z.enum(["buy", "sell"]),
  symbol: z.string(),
  price: z.number().positive(),
  takeProfitPrice: z.number().positive(),
  stopLossPrice: z.number().positive(),
  riskRewardRatio: z.number().positive(),
})

// エントリーのバリデーション関数
export function validateEntry(entry: unknown) {
  return entrySchema.safeParse(entry)
}

// エントリー作成のバリデーション関数
export function validateCreateEntry(data: unknown) {
  return createEntrySchema.safeParse(data)
}

// エントリー更新のバリデーション関数
export function validateUpdateEntry(data: unknown) {
  return updateEntrySchema.safeParse(data)
}
