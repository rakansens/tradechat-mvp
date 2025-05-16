/**
 * components/chat/section/ui/QuickCommands.tsx
 * クイックコマンドボタン群コンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-06-29: インラインスタイルをTailwindクラスに変更
 */

"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { QuickCommand } from "@/hooks/chat"

interface QuickCommandsProps {
  commands: QuickCommand[]
}

/**
 * クイックコマンドボタン群コンポーネント
 * 
 * useQuickCommandsフックから受け取ったコマンド配列を
 * ボタンとして表示します。
 * 
 * @param commands クイックコマンド配列
 */
export const QuickCommands = ({ commands }: QuickCommandsProps) => {
  return (
    <div className="flex space-x-1">
      {commands.map((cmd) => (
        <Button
          key={cmd.value}
          size="sm"
          variant="outline"
          className={cn(
            "text-xs h-7",
            "bg-background-tertiary",
            "border-border-light",
            "text-text-secondary",
            "hover:bg-background-tertiary/80"
          )}
          onClick={cmd.action}
        >
          {cmd.icon}
          {cmd.label}
        </Button>
      ))}
    </div>
  );
};

export default QuickCommands; 