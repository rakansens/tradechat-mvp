/**
 * components/chat/section/ui/ExecuteButton.tsx
 * エントリー実行ボタンコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 */

"use client"

import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { theme } from "@/styles/colors"
import type { OpenEntry } from "@/types/entry"

interface ExecuteButtonProps {
  pendingEntry: OpenEntry | null
  executeEntry: () => void
}

/**
 * エントリー実行ボタンコンポーネント
 * 
 * pendingEntryがあるときのみ表示され、クリックするとエントリーを実行します。
 * 
 * @param pendingEntry 保留中のエントリー情報
 * @param executeEntry エントリー実行ハンドラー
 */
export const ExecuteButton = ({ pendingEntry, executeEntry }: ExecuteButtonProps) => {
  if (!pendingEntry) return null;
  
  return (
    <Button
      variant="success"
      size="sm"
      className="h-7 text-xs ml-auto"
      style={{ 
        backgroundColor: theme.accent.blue,
        color: "white"
      }}
      onClick={() => executeEntry()}
    >
      <Send className="h-3 w-3 mr-1" />
      Execute Entry
    </Button>
  );
};

export default ExecuteButton; 