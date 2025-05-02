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
    <div className="w-full md:w-1/3 h-1/2 md:h-full p-3 flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center">
            <MessageSquare className="h-4 w-4 text-primary mr-2" />
            AI Assistant
          </CardTitle>
        </CardHeader>

        <Separator />

        <CardContent className="p-0 flex-1 overflow-hidden">
          <ChatWindow
            messages={messages}
            ref={chatEndRef}
            isSearching={isSearching}
            onExecuteEntry={executeEntry}
            pendingEntry={pendingEntry}
          />
        </CardContent>

        <Separator />

        <CardFooter className="p-3">
          <form onSubmit={handleSubmit} className="w-full space-y-2">
            <div className="flex gap-2">
              <InputBox
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about the market..."
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              {quickCommands.map((command) => (
                <Button
                  key={command.value}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInput(command.value)
                    command.action()
                  }}
                  className="flex items-center text-xs h-7"
                >
                  {command.icon}
                  {command.label}
                </Button>
              ))}
            </div>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
