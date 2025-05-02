"use client"

import { ArrowRightCircle } from "lucide-react"

interface ActionButtonProps {
  onClick: () => void
  label: string
}

export default function ActionButton({ onClick, label }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2 px-4 rounded-md transition-all flex items-center justify-center"
    >
      <ArrowRightCircle className="h-4 w-4 mr-2" />
      {label}
    </button>
  )
}
