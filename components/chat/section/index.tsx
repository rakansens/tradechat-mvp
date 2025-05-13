/**
 * components/chat/section/index.tsx
 * チャットセクションのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: マルチスレッド機能のサポートを追加
 * - 2025-05-21: UIUXを既存デザインに合わせ、サイドバーのトグル表示を実装
 */

"use client"

import { FormEvent, useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ChatWindow from "@/components/chat/ChatWindow"
import { theme } from "@/styles/colors"
import { useChatSectionStores, useQuickCommands } from "@/hooks/chat"
import { Sidebar } from "@/components/chat/sidebar"
import { Menu, MessageSquare, ChevronLeft, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

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

  // アクティブな会話ID
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // マウント後にサイドバーを表示
  const [isMounted, setIsMounted] = useState(false);
  
  // サイドバーの表示状態
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // トグルサイドバー
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.secondary }}>
        {/* マルチスレッドチャットUI */}
        <div className="flex h-full">
          {/* モバイル用サイドバートリガー */}
          {isMounted && !sidebarVisible && (
            <div className="md:hidden fixed top-20 left-2 z-50">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">サイドバーを開く</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <Sidebar />
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* デスクトップ用サイドバー（トグル可能） */}
          {isMounted && (
            <div className={`${sidebarVisible ? 'block' : 'hidden'} md:block border-r bg-[#1e2130] transition-all ease-in-out duration-300`} style={{ width: sidebarVisible ? '280px' : '0' }}>
              <Sidebar />
            </div>
          )}

          {/* サイドバートグルボタン（デスクトップ用） */}
          {isMounted && (
            <div className="hidden md:block h-8 w-8 absolute top-[70px] z-10 cursor-pointer" 
                 style={{ left: sidebarVisible ? '290px' : '10px' }}
                 onClick={toggleSidebar}>
              <Button variant="ghost" size="icon" className="rounded-full bg-[#2d3142]">
                {sidebarVisible ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* チャットメイン */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
          </div>
        </div>
      </Card>
    </div>
  );
} 