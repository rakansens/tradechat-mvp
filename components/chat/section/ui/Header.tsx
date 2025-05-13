/**
 * components/chat/section/ui/Header.tsx
 * チャットセクションのヘッダーコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 */

"use client"

import { MessageSquare } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { theme } from "@/styles/colors"

/**
 * チャットセクションのヘッダーコンポーネント
 * 
 * AIアシスタントのタイトルを表示します。
 */
export const Header = () => {
  return (
    <CardHeader className="py-2 px-4 border-b" style={{ backgroundColor: theme.background.secondary, borderColor: theme.border.light }}>
      <CardTitle className="text-sm font-medium flex items-center" style={{ color: theme.text.primary }}>
        <MessageSquare className="h-4 w-4 mr-2" style={{ color: theme.accent.blue }} />
        AI Assistant
      </CardTitle>
    </CardHeader>
  );
};

export default Header; 