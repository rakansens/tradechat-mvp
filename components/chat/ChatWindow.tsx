"use client"

import { useState } from "react"
import { forwardRef } from "react"
import type { Message } from "ai"
import { Loader2, ArrowUp, ArrowDown, Pencil, Check } from "lucide-react"
import type { Entry } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ChatWindowProps {
  messages: Message[]
  isSearching?: boolean
  onExecuteEntry?: () => void
  pendingEntry?: Entry | null
}

const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ messages, isSearching = false, onExecuteEntry, pendingEntry }, ref) => {
    return (
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((message, index) => {
          const isProposal = (message as any).isProposal
          const proposalType = (message as any).proposalType
          const price = (message as any).price

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
function ProposalTypeIndicator({ type }: { type: string }) {
  return (
    <div className="mb-2 flex items-center">
      {type === "buy" ? (
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
  proposalType: string
  isLastMessage: boolean
  pendingEntry: Entry | null
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
    <Card className="mt-3 bg-card/70 dark:bg-card/50 border border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-medium">Trade Details</CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!isEditing ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="font-medium text-muted-foreground">Entry Price:</div>
              <div className="font-mono text-right text-foreground">${entryPrice.toLocaleString()}</div>

              <div className="font-medium text-muted-foreground">Take Profit:</div>
              <div className="font-mono text-right text-success">${takeProfitPrice.toLocaleString()}</div>

              <div className="font-medium text-muted-foreground">Stop Loss:</div>
              <div className="font-mono text-right text-destructive">${stopLossPrice.toLocaleString()}</div>

              <div className="font-medium text-muted-foreground">Type:</div>
              <div className={cn("text-right font-medium", proposalType === "buy" ? "text-success" : "text-destructive")}>
                {proposalType === "buy" ? "LONG" : "SHORT"}
              </div>

              <div className="font-medium text-muted-foreground">Symbol:</div>
              <div className="text-right text-foreground">{symbol}</div>

              <div className="font-medium text-muted-foreground">Potential Profit:</div>
              <div className="font-mono text-right text-success">
                ${potentialProfit > 0 ? potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                {profitPercentage !== "N/A" && ` (${profitPercentage}%)`}
              </div>

              <div className="font-medium text-muted-foreground">Risk/Reward:</div>
              <div className="font-mono text-right text-foreground">
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
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              {/* TODO: Implement actual save logic that updates pendingEntry state */}
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveChanges}>
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
      <Card className="p-3">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Searching market data...
        </div>
      </Card>
    </div>
  )
}
