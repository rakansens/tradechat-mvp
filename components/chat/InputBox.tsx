"use client"

import type { ChangeEvent } from "react"
import { Input } from "@/components/ui/input"

interface InputBoxProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export default function InputBox({ value, onChange, placeholder = "Type a message...", className }: InputBoxProps) {
  return <Input type="text" value={value} onChange={onChange} placeholder={placeholder} className={`flex-1 ${className || ''}`} />
}
