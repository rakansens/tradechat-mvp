"use client"

import { MessageSquare, Send, Zap, TrendingUp, BarChart2 } from "lucide-react"
import ChatWindow from "@/components/chat/ChatWindow"
import InputBox from "@/components/chat/InputBox"
import type { Entry } from "@/types"
import type { RefObject, FormEvent } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/store/useStore"
import { useState } from "react"
import type { Message } from "ai"
import { theme } from "@/styles/colors"

interface ChatSectionProps {
  messages: Message[]
  isSearching: boolean
  pendingEntry: Entry | null
  chatEndRef: RefObject<HTMLDivElement>
  executeEntry: () => void
}

export default function ChatSection({
  messages,
  isSearching,
  pendingEntry,
  chatEndRef,
  executeEntry,
}: ChatSectionProps) {
  // Local input state
  const [input, setInput] = useState("")

  // Get actions from store
  const { handleEntryPointQuery, handleNewsQuery, handleAIProposalQuery, addMessage } = useStore()

  // Quick commands
  const quickCommands = [
    {
      label: "Entry Point",
      value: "Entry Point",
      icon: <TrendingUp className="h-3 w-3 mr-1" />,
      action: handleEntryPointQuery,
    },
    {
      label: "Market News",
      value: "Market News",
      icon: <BarChart2 className="h-3 w-3 mr-1" />,
      action: handleNewsQuery,
    },
    { label: "AI Signal", value: "AI Signal", icon: <Zap className="h-3 w-3 mr-1" />, action: handleAIProposalQuery },
  ]

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim()) return

    // Check if input matches any quick command
    const matchedCommand = quickCommands.find((cmd) => cmd.value === input.trim())
    if (matchedCommand) {
      matchedCommand.action()
    } else {
      // Handle regular message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: input,
      }
      addMessage(userMessage)

      // Here you would typically call an API for AI response
      // For now, just echo back
      setTimeout(() => {
        const aiResponse: Message = {
          id: Date.now().toString() + "-response",
          role: "assistant",
          content: `You said: "${input}". This is a placeholder response. In a real app, this would be processed by an AI model.`,
        }
        addMessage(aiResponse)
      }, 500)
    }

    // Clear input
    setInput("")
  }

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

        {/* チャットウィンドウ */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ChatWindow
            messages={messages}
            ref={chatEndRef}
            isSearching={isSearching}
            onExecuteEntry={executeEntry}
            pendingEntry={pendingEntry}
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
                onClick={executeEntry}
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
                onChange={(e) => setInput(e.target.value)}
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
