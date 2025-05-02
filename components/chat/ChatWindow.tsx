// components/chat/ChatWindow.tsx
// 更新: Message型をExtendedMessage型に置き換え、Entry型のインポートパスを修正
"use client"

import { useState } from "react"
import { forwardRef } from "react"
import { Loader2, ArrowUp, ArrowDown, Pencil, Check } from "lucide-react"
import type { Entry, OpenEntry } from "@/types/entry"
import type { ExtendedMessage, ProposalType } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { theme } from "@/styles/colors"

interface ChatWindowProps {
  messages: ExtendedMessage[]
  isSearching?: boolean
  onExecuteEntry?: () => void
  pendingEntry?: OpenEntry | null
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ messages, isSearching = false, onExecuteEntry, pendingEntry }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((message, index) => {
          // ExtendedMessage型を使用して型安全にアクセス
          const isProposal = message.isProposal
          const proposalType = message.proposalType
          const price = message.price

          return (
            <div
              key={message.id}
              className={`mb-3 ${message.role === "user" ? "flex justify-end" : "flex justify-start"}`}
            >
              <div className={`max-w-[85%] ${message.role === "user" ? "" : "flex"}`}>
                {message.role !== "user" && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>AI</AvatarFallback>
                    <AvatarImage src="/abstract-ai-network.png" />
                  </Avatar>
                )}

                <Card className={`p-3 ${isProposal ? "bg-gradient-to-r from-card to-card/80 border-primary/20" : ""}`}>
                  {isProposal && proposalType && <ProposalTypeIndicator type={proposalType} />}

                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {isProposal && price && (
                    <ProposalDetails
                      price={price}
                      proposalType={proposalType}
                      isLastMessage={index === messages.length - 1}
                      pendingEntry={pendingEntry ?? null}
                      onExecuteEntry={onExecuteEntry}
                    />
                  )}
                </Card>
              </div>
            </div>
          )
        })}

        {isSearching && <SearchingIndicator />}

        <div ref={ref} />
      </div>
    )
  },
)

ChatWindow.displayName = "ChatWindow"

export default ChatWindow

// Proposal type indicator component
function ProposalTypeIndicator({ type }: { type: ProposalType | undefined }) {
  // typeが未定義の場合はデフォルトでbuyとして扱う
  const proposalType = type || "buy"
  return (
    <div className="mb-2 flex items-center">
      {proposalType === "buy" ? (
        <Badge variant="success" className="flex items-center mb-2">
          <ArrowUp className="h-3 w-3 mr-1" />
          BUY SIGNAL
        </Badge>
      ) : (
        <Badge variant="destructive" className="flex items-center mb-2">
          <ArrowDown className="h-3 w-3 mr-1" />
          SELL SIGNAL
        </Badge>
      )}
    </div>
  )
}

// Proposal details component
function ProposalDetails({
  price,
  proposalType,
  isLastMessage,
  pendingEntry,
  onExecuteEntry,
}: {
  price: number
  proposalType: ProposalType | undefined
  isLastMessage: boolean
  pendingEntry: OpenEntry | null
  onExecuteEntry?: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  // Use pendingEntry values if available, otherwise calculate fallbacks
  const initialEntryPrice = pendingEntry?.price ?? price
  const initialTakeProfit = pendingEntry?.takeProfit ?? (proposalType === "buy" ? Math.round(initialEntryPrice * 1.05) : Math.round(initialEntryPrice * 0.95))
  const initialStopLoss = pendingEntry?.stopLoss ?? (proposalType === "buy" ? Math.round(initialEntryPrice * 0.98) : Math.round(initialEntryPrice * 1.02))

  const [entryPrice, setEntryPrice] = useState(initialEntryPrice)
  const [takeProfitPrice, setTakeProfitPrice] = useState(initialTakeProfit)
  const [stopLossPrice, setStopLossPrice] = useState(initialStopLoss)
  const symbol = pendingEntry?.symbol ?? "BTC/USD" // Default or from entry

  // Calculate potential profit and risk-reward ratio based on current state values
  const potentialProfit = proposalType === "buy" ? takeProfitPrice - entryPrice : entryPrice - takeProfitPrice
  const potentialLoss = proposalType === "buy" ? entryPrice - stopLossPrice : stopLossPrice - entryPrice
  const riskRewardRatio = potentialLoss > 0 && !isNaN(potentialProfit) && !isNaN(potentialLoss) ? (potentialProfit / potentialLoss).toFixed(2) : "N/A"
  const profitPercentage = entryPrice > 0 && !isNaN(potentialProfit) ? ((potentialProfit / entryPrice) * 100).toFixed(2) : "N/A"

  // TODO: Add logic to update pendingEntry when edited values are saved
  const handleSaveChanges = () => {
    // Here you would typically update the pendingEntry state in the parent component
    // For now, just exit editing mode
    setIsEditing(false)
  }

  return (
    <Card className="mt-3 border shadow-sm" style={{ backgroundColor: `${theme.background.card}80`, borderColor: `${theme.border.light}80` }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium" style={{ color: theme.text.primary }}>Trade Details</CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" style={{ color: theme.text.muted }} onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!isEditing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="font-medium" style={{ color: theme.text.secondary }}>Entry Price:</div>
              <div className="font-mono text-right" style={{ color: theme.text.primary }}>${entryPrice.toLocaleString()}</div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Take Profit:</div>
              <div className="font-mono text-right" style={{ color: theme.accent.green }}>${takeProfitPrice.toLocaleString()}</div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Stop Loss:</div>
              <div className="font-mono text-right" style={{ color: theme.accent.red }}>${stopLossPrice.toLocaleString()}</div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Type:</div>
              <div className="text-right font-medium" style={{ color: proposalType === "buy" ? theme.accent.green : theme.accent.red }}>
                {proposalType === "buy" ? "LONG" : "SHORT"}
              </div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Symbol:</div>
              <div className="text-right" style={{ color: theme.text.primary }}>{symbol}</div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Potential Profit:</div>
              <div className="font-mono text-right" style={{ color: theme.accent.green }}>
                ${potentialProfit > 0 ? potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                {profitPercentage !== "N/A" && ` (${profitPercentage}%)`}
              </div>

              <div className="font-medium" style={{ color: theme.text.secondary }}>Risk/Reward:</div>
              <div className="font-mono text-right" style={{ color: theme.text.primary }}>
                {riskRewardRatio !== "N/A" ? `1:${riskRewardRatio}` : "N/A"}
              </div>
            </div>
            {isLastMessage && onExecuteEntry && (
              <Button className="w-full h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onExecuteEntry}>
                Execute {proposalType === "buy" ? "Long" : "Short"} @ ${entryPrice.toLocaleString()}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 items-center">
              <label htmlFor="entry-price" className="text-xs font-medium text-muted-foreground">Entry Price</label>
              <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value))} className="h-8 text-xs" />

              <label htmlFor="take-profit" className="text-xs font-medium text-muted-foreground">Take Profit</label>
              <Input id="take-profit" type="number" value={takeProfitPrice} onChange={(e) => setTakeProfitPrice(Number(e.target.value))} className="h-8 text-xs" />

              <label htmlFor="stop-loss" className="text-xs font-medium text-muted-foreground">Stop Loss</label>
              <Input id="stop-loss" type="number" value={stopLossPrice} onChange={(e) => setStopLossPrice(Number(e.target.value))} className="h-8 text-xs" />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" style={{ color: theme.text.secondary }} onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              {/* TODO: Implement actual save logic that updates pendingEntry state */}
              <Button size="sm" className="h-7 text-xs" style={{ backgroundColor: theme.accent.blue, color: "white" }} onClick={handleSaveChanges}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Searching indicator component
function SearchingIndicator() {
  return (
    <div className="flex items-start mb-3">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarFallback>AI</AvatarFallback>
        <AvatarImage src="/abstract-ai-network.png" />
      </Avatar>
      <Card className="p-3" style={{ backgroundColor: theme.background.card, borderColor: theme.border.light }}>
        <div className="flex items-center" style={{ color: theme.text.secondary }}>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Searching market data...
        </div>
      </Card>
    </div>
  )
}
