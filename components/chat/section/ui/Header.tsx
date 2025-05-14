/**
 * components/chat/section/ui/Header.tsx
 * チャットセクションのヘッダーコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-31: メモリトグルボタンを追加
 * - 2025-05-31: レイアウト改善、AIアシスタントタイトルとメモリボタンを中央配置
 * - 2025-05-31: AIアシスタントテキストを左寄せに修正
 * - 2025-05-31: レイアウト構造を単純化し、AIアシスタントを左、メモリボタンを右に確実に配置
 */

"use client"

import { MessageSquare } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { theme } from "@/styles/colors"
import { MemoryToggle } from "@/components/chat/ui/MemoryToggle"

interface HeaderProps {
  onToggleMemory: () => void;
  isMemoryOpen: boolean;
}

/**
 * チャットセクションのヘッダーコンポーネント
 * 
 * AIアシスタントのタイトルを表示します。
 */
export const Header = ({ onToggleMemory, isMemoryOpen }: HeaderProps) => {
  return (
    <div 
      className="flex items-center justify-between px-4 py-2 border-b"
      style={{ backgroundColor: theme.background.secondary, borderColor: theme.border.light }}
    >
      {/* 左側: AIアシスタントタイトル */}
      <div className="flex items-center">
        <MessageSquare className="h-4 w-4 mr-2" style={{ color: theme.accent.blue }} />
        <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
          AI Assistant
        </span>
      </div>
      
      {/* 右側: メモリトグルボタン */}
      <MemoryToggle 
        onClick={onToggleMemory} 
        isOpen={isMemoryOpen} 
      />
    </div>
  );
};

export default Header; 