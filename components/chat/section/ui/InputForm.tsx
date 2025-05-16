/**
 * components/chat/section/ui/InputForm.tsx
 * チャット入力フォームコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-06-28: Tailwindクラスに変更
 */

"use client"

import { FormEvent } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import InputBox from "@/components/chat/InputBox"

interface InputFormProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
}

/**
 * チャット入力フォームコンポーネント
 * 
 * メッセージ入力ボックスと送信ボタンを含むフォームを提供します。
 * 
 * @param value 入力値
 * @param onChange 入力変更ハンドラー
 * @param onSubmit フォーム送信ハンドラー
 */
export const InputForm = ({ value, onChange, onSubmit }: InputFormProps) => {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex gap-2">
        <InputBox
          value={value}
          onChange={onChange}
          placeholder="Ask about the market..."
          className=""
        />
        <Button 
          type="submit" 
          size="icon" 
          className="bg-accent-blue text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default InputForm; 