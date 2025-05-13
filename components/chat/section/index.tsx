/**
 * components/chat/section/index.tsx
 * チャットセクションのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 */

"use client"

import { FormEvent } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ChatWindow from "@/components/chat/ChatWindow"
import { theme } from "@/styles/colors"
import { useChatSectionStores, useQuickCommands } from "@/hooks/chat"

// UIコンポーネント
import Header from "./ui/Header"
import QuickCommands from "./ui/QuickCommands"
import ExecuteButton from "./ui/ExecuteButton"
import InputForm from "./ui/InputForm"

// 共通インターフェースを使用して型定義を整理
import type { RefObject } from "react"
import type { OpenEntry } from "@/types/entry"

interface ChatSectionProps {
  chatEndRef: RefObject<HTMLDivElement>
  executeEntry: () => void
  editPendingEntry: (updatedEntry: OpenEntry) => void
  cancelPendingEntry: () => void
}

/**
 * チャットセクションのメインコンポーネント
 * 
 * 各UIコンポーネントを統合し、データフローを管理します。
 */
export default function ChatSection({
  chatEndRef,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry
}: ChatSectionProps) {
  // ストアから状態とアクションを取得
  const { chat, entry } = useChatSectionStores();
  
  // クイックコマンドを取得
  const quickCommands = useQuickCommands();
  
  // 入力変更ハンドラー
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    chat.setInput(e.target.value);
  };
  
  // 送信ハンドラー
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (chat.input.trim()) {
      chat.sendMessage(chat.input);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.secondary }}>
        {/* ヘッダー部分 */}
        <Header />

        {/* チャットウィンドウ */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ChatWindow
            ref={chatEndRef}
            onExecuteEntry={executeEntry}
            editPendingEntry={editPendingEntry}
            cancelPendingEntry={cancelPendingEntry}
          />
        </CardContent>

        <Separator className="border" style={{ borderColor: theme.border.light }} />

        {/* フッター部分 - クイックコマンドと入力エリア */}
        <CardFooter className="p-2 flex flex-col gap-2 border-t" style={{ backgroundColor: theme.background.secondary, borderColor: theme.border.light }}>
          {/* クイックコマンドボタンとエントリー実行ボタン */}
          <div className="flex items-center justify-between w-full">
            <QuickCommands commands={quickCommands} />
            <ExecuteButton pendingEntry={entry.pendingEntry} executeEntry={executeEntry} />
          </div>

          {/* 入力フォーム */}
          <InputForm 
            value={chat.input} 
            onChange={handleInputChange} 
            onSubmit={handleSubmit} 
          />
        </CardFooter>
      </Card>
    </div>
  );
} 