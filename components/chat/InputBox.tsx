"use client"

import type { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputBoxProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export default function InputBox({ value, onChange, placeholder = "Type a message...", className }: InputBoxProps) {
  // Tailwindクラスを使用したデフォルトスタイル
  const defaultClassName = "flex-1 bg-background-tertiary border-border-light text-text-primary placeholder:text-text-muted";
  
  return (
    <Input 
      type="text" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={cn(defaultClassName, className)} 
    />
  )
}
