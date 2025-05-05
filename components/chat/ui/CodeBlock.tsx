// components/chat/ui/CodeBlock.tsx
// 作成: コードブロック表示とアクション機能
// シンタックスハイライト、コピー機能など開発者向け機能を実装

import { useState, memo } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export const CodeBlock = memo(({ code, language = "plaintext", className }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false)

  // コードをクリップボードにコピー
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err)
    }
  }

  return (
    <div className={cn(
      "relative rounded-md bg-gray-950 dark:bg-gray-900 overflow-hidden",
      className
    )}>
      {/* 言語表示ラベル */}
      {language !== "plaintext" && (
        <div className="bg-gray-800 text-gray-300 text-xs px-3 py-1 border-b border-gray-700">
          {language}
        </div>
      )}
      
      {/* コード表示エリア */}
      <pre className="overflow-x-auto p-4 text-sm text-gray-300">
        <code>{code}</code>
      </pre>
      
      {/* コピーボタン */}
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors"
        aria-label="コードをコピー"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-gray-300" />
        )}
      </button>
    </div>
  )
})

CodeBlock.displayName = "CodeBlock"
