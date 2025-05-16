/**
 * components/chat/section/index.tsx
 * チャットセクションのメインコンポーネント
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: マルチスレッド機能のサポートを追加
 * - 2025-05-21: UIUXを既存デザインに合わせ、サイドバーのトグル表示を実装
 * - 2025-05-21: サイドバー閉時にコンパクトなアイコンバーを表示するよう変更
 * - 2025-05-21: ChatGPTライクなUIに調整、サイドバー表示を改善
 * - 2025-05-31: メモリパネル機能を統合
 * - 2025-05-31: メモリパネルの表示位置を調整し、ヘッダー下に表示するよう変更
 * - 2025-06-01: メモリパネルに現在のチャットコンテキストを渡す機能を追加
 * - 2025-06-25: ConversationContextを使用するよう変更
 */

"use client"

import { FormEvent, useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ChatWindow from "@/components/chat/window"
import { useChatSectionStores, useQuickCommands } from "@/hooks/chat"
import { Sidebar } from "@/components/chat/sidebar"
import { MessageSquare, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import NewThreadModal from "@/components/chat/modals/NewThreadModal"
import { MemoryPanel } from "@/components/chat/ui/MemoryPanel"
import { useConversation } from "@/contexts/ConversationContext"

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
  
  // ConversationContextから会話IDを取得
  const { conversationId, setConversationId } = useConversation();
  
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
  
  // マウント後にサイドバーを表示
  const [isMounted, setIsMounted] = useState(false);
  
  // サイドバーの表示状態
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  // メモリパネルの表示状態
  const [isMemoryPanelOpen, setIsMemoryPanelOpen] = useState(false);
  
  // 新規会話モーダルの表示状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 現在のチャットコンテキスト
  const [currentChatContext, setCurrentChatContext] = useState<string>("");
  
  // トグルサイドバー
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  // サイドバーを閉じる
  const closeSidebar = () => {
    setSidebarVisible(false);
  };
  
  // メモリパネルの表示/非表示を切り替える
  const toggleMemoryPanel = () => {
    setIsMemoryPanelOpen(!isMemoryPanelOpen);
  };
  
  // 新規会話作成モーダルを開く
  const openNewThreadModal = () => {
    setIsModalOpen(true);
  };
  
  // 新規会話作成後のコールバック
  const onNewThreadCreated = (newThread: any) => {
    // コンテキストを使用して会話IDを設定
    setConversationId(newThread.id);
    setIsModalOpen(false);
  };
  
  // メモリをチャット入力に挿入する
  const handleInsertMemory = (content: string) => {
    const currentInput = chat.input || '';
    const newInput = currentInput ? `${currentInput}\n\n${content}` : content;
    chat.setInput(newInput);
    setIsMemoryPanelOpen(false);
  };
  
  // 現在のチャットコンテキストを更新する
  useEffect(() => {
    // チャットメッセージから現在のコンテキストを生成
    if (chat.messages.length > 0) {
      // 最新の数件のメッセージを使用してコンテキストを生成（最大1000文字）
      const recentMessages = chat.messages.slice(-5); // 最新の5件
      
      const context = recentMessages.map(msg => {
        const role = msg.role === 'user' ? 'あなた' : 'AI';
        return `${role}: ${msg.content}`;
      }).join('\n\n');
      
      setCurrentChatContext(context.slice(0, 1000)); // 長すぎるとembedding生成に問題が出る可能性があるため制限
    } else {
      setCurrentChatContext("");
    }
  }, [chat.messages]);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none bg-background-secondary">
        {/* マルチスレッドチャットUI */}
        <div className="flex h-full">
          {/* モバイル用サイドバートリガー - モバイル時のみ表示 */}
          {isMounted && (
            <div className="md:hidden fixed top-20 left-2 z-50">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-[#1e2130] border-none hover:bg-[#2d3142]">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">サイドバーを開く</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                  <Sidebar onClose={closeSidebar} />
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* デスクトップ用 - 左端アイコンバー */}
          {isMounted && !sidebarVisible && (
            <div className="hidden md:flex flex-col items-center justify-start w-[68px] h-full bg-[#1e2130] border-r border-gray-800">
              {/* 新規会話ボタン */}
              <div className="mt-5 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openNewThreadModal}
                  className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
                >
                  <Plus className="h-5 w-5 text-white" />
                </Button>
              </div>
              
              {/* 会話履歴ボタン */}
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="w-10 h-10 rounded-full bg-[#2d3142] hover:bg-[#383f55] flex items-center justify-center"
                >
                  <MessageSquare className="h-5 w-5 text-gray-300" />
                </Button>
              </div>
            </div>
          )}
          
          {/* サイドバー（表示時のみ） */}
          {isMounted && sidebarVisible && (
            <div className="hidden md:block w-[280px] h-full">
              <Sidebar onClose={closeSidebar} />
            </div>
          )}

          {/* チャットメイン */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="relative">
              {/* ヘッダー部分 */}
              <Header 
                onToggleMemory={toggleMemoryPanel} 
                isMemoryOpen={isMemoryPanelOpen} 
                connection={chat.connection}
              />
              
              {/* メモリパネル - ヘッダー直下に配置 */}
              {isMemoryPanelOpen && (
                <MemoryPanel
                  isOpen={isMemoryPanelOpen}
                  onClose={() => setIsMemoryPanelOpen(false)}
                  onInsertMemory={handleInsertMemory}
                  currentChatContext={currentChatContext}
                />
              )}
            </div>

            {/* チャットウィンドウ */}
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ChatWindow
                ref={chatEndRef}
                onExecuteEntry={executeEntry}
                editPendingEntry={editPendingEntry}
                cancelPendingEntry={cancelPendingEntry}
              />
            </CardContent>

            <Separator className="border border-border-light" />

            {/* フッター部分 - クイックコマンドと入力エリア */}
            <CardFooter className="p-2 flex flex-col gap-2 border-t border-border-light bg-background-secondary">
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
      
      {/* 新規スレッド作成モーダル */}
      <NewThreadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onThreadCreated={onNewThreadCreated}
      />
    </div>
  );
} 