// components/chat/ChatSection.tsx
// 更新: セレクタパターンを一貫して適用するように修正
"use client"

import { MessageSquare, Send, Zap, TrendingUp, BarChart2 } from "lucide-react"
import { memo, useCallback } from "react"
import ChatWindow from "@/components/chat/ChatWindow"
import InputBox from "@/components/chat/InputBox"
import { 
  useChatStore, 
  useEntryStore, 
  // メモ化されたセレクター
  selectMessages, 
  selectIsSearching,
  selectInput,
  selectSetInput,
  selectSendMessage,
  selectAddMessage,
  selectPendingEntry,
  selectHasPendingEntry
} from "@/store"
import type { OpenEntry } from "@/types/entry"
import type { ExtendedMessage } from "@/types/chat"
import type { MessageDisplayProps, TradeActionProps } from "@/types/common-interfaces"
import type { RefObject, FormEvent } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { theme } from "@/styles/colors"

// 共通インターフェースを使用して型定義を整理
interface ChatSectionProps {
  chatEndRef: RefObject<HTMLDivElement>
  executeEntry: () => void
  editPendingEntry: (updatedEntry: OpenEntry) => void
  cancelPendingEntry: () => void
}

export default function ChatSection({
  chatEndRef,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry
}: ChatSectionProps) {
  // メモ化されたセレクターを使用してデータと状態を取得
  const messages = useChatStore(selectMessages);
  const isLoading = useChatStore(selectIsSearching);
  const input = useChatStore(selectInput);
  const pendingEntry = useEntryStore(selectPendingEntry);
  
  // メモ化されたセレクターを使用してアクションを取得
  const setInput = useChatStore(selectSetInput);
  const sendMessage = useChatStore(selectSendMessage);
  
  // 入力変更ハンドラー
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, [setInput]);
  
  // 送信ハンドラー
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  }, [input, sendMessage]);
  // Quick commands
  const quickCommands = [
    {
      label: "Entry Point",
      value: "Entry Point",
      icon: <TrendingUp className="h-3 w-3 mr-1" />,
      action: () => console.log("Entry Point"),
    },
    {
      label: "Market News",
      value: "Market News",
      icon: <BarChart2 className="h-3 w-3 mr-1" />,
      action: () => console.log("Market News"),
    },
    { label: "AI Signal", value: "AI Signal", icon: <Zap className="h-3 w-3 mr-1" />, action: () => console.log("AI Signal") },
  ]

  return (
    <div className="w-full h-full flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.secondary }}>
        {/* ヘッダー部分 */}
        <CardHeader className="py-2 px-4 border-b" style={{ backgroundColor: theme.background.secondary, borderColor: theme.border.light }}>
          <CardTitle className="text-sm font-medium flex items-center" style={{ color: theme.text.primary }}>
            <MessageSquare className="h-4 w-4 mr-2" style={{ color: theme.accent.blue }} />
            AI Assistant
          </CardTitle>
        </CardHeader>

        {/* チャットウィンドウ - リファクタリングされたコンポーネントに必要なプロップスを渡す */}
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
          {/* クイックコマンドボタン */}
          <div className="flex items-center justify-between w-full">
            <div className="flex space-x-1">
              {quickCommands.map((cmd) => (
                <Button
                  key={cmd.value}
                  size="sm"
                  variant="outline"
                  className="text-xs h-7" 
                  style={{ 
                    backgroundColor: theme.background.tertiary,
                    borderColor: theme.border.light,
                    color: theme.text.secondary,
                  }}
                  onClick={cmd.action}
                >
                  {cmd.icon}
                  {cmd.label}
                </Button>
              ))}
            </div>

            {/* エントリー実行ボタン */}
            {pendingEntry && (
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
            )}
          </div>

          {/* 入力フォーム */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2">
              <InputBox
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about the market..."
                className=""
              />
              <Button 
                type="submit" 
                size="icon" 
                className=""
                style={{ 
                  backgroundColor: theme.accent.blue,
                  color: "white"
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
