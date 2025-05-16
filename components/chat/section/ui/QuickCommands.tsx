/**
 * components/chat/section/ui/QuickCommands.tsx
 * クイックコマンドボタン群コンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 */

"use client"

import { Button } from "@/components/ui/button"

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
          className="text-xs h-7" 
          style={{ 
            backgroundColor: bg-background-tertiary,
            borderColor: border-border-light,
            color: text-text-secondary,
          }}
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