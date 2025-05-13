import { z } from "zod"

// チャットメッセージのバリデーションスキーマ
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  isProposal: z.boolean().optional(),
  proposalType: z.enum(["buy", "sell"]).optional(),
  price: z.number().positive().optional(),
})

// チャット入力のバリデーションスキーマ
export const chatInputSchema = z.object({
  message: z.string().min(1, "メッセージを入力してください"),
})

// クイックコマンドのバリデーションスキーマ
export const quickCommandSchema = z.enum(["Entry Point", "Market News", "AI Signal", "Sell Entry"])

// チャットメッセージのバリデーション関数
export function validateMessage(message: unknown) {
  return messageSchema.safeParse(message)
}

// チャット入力のバリデーション関数
export function validateChatInput(input: unknown) {
  return chatInputSchema.safeParse(input)
}

// クイックコマンドのバリデーション関数
export function validateQuickCommand(command: unknown) {
  return quickCommandSchema.safeParse(command)
}
