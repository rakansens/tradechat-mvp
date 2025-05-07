// components/ui/ZodForm.tsx
// 作成: React Hook FormとZodを連携させるためのフォームコンポーネント

"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// フォームのスキーマ定義
const formSchema = z.object({
  symbol: z.string().min(1, "銘柄を入力してください"),
  price: z.coerce.number().positive("価格は正の数値を入力してください"),
  quantity: z.coerce.number().positive("数量は正の数値を入力してください"),
})

// 型定義のエクスポート
export type FormValues = z.infer<typeof formSchema>

// フォームコンポーネントのプロパティ
interface ZodFormProps {
  onSubmit: (values: FormValues) => void
  defaultValues?: Partial<FormValues>
}

// Zodを使用したフォームコンポーネント
export function ZodForm({ onSubmit, defaultValues = {} }: ZodFormProps) {
  // React Hook FormとZodを連携
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symbol: "",
      price: 0,
      quantity: 0,
      ...defaultValues
    }
  })

  // フォーム送信ハンドラ
  const handleSubmit = (values: FormValues) => {
    onSubmit(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>銘柄</FormLabel>
              <FormControl>
                <Input placeholder="BTC-USDT" {...field} />
              </FormControl>
              <FormDescription>
                取引する銘柄を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>価格</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormDescription>
                取引価格を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>数量</FormLabel>
              <FormControl>
                <Input type="number" step="0.001" {...field} />
              </FormControl>
              <FormDescription>
                取引数量を入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">送信</Button>
      </form>
    </Form>
  )
}

// 使用例
export function ZodFormExample() {
  const handleSubmit = (values: FormValues) => {
    console.log("フォーム送信:", values)
    // ここでAPIリクエストなどの処理を行う
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">取引フォーム</h2>
      <ZodForm onSubmit={handleSubmit} defaultValues={{ symbol: "BTC-USDT" }} />
    </div>
  )
}