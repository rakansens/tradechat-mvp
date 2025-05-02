"use client"

import type { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { theme } from "@/styles/colors"

interface InputBoxProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export default function InputBox({ value, onChange, placeholder = "Type a message...", className }: InputBoxProps) {
  // テーマカラーを使用したデフォルトスタイル
  const defaultClassName = `flex-1 bg-[${theme.background.tertiary}] border-[${theme.border.light}] text-[${theme.text.primary}] placeholder:text-[${theme.text.muted}]`;
  
  return (
    <Input 
      type="text" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={`${defaultClassName} ${className || ''}`} 
    />
  )
}
