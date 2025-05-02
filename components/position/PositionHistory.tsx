// components/position/PositionHistory.tsx
// 更新: 共通インターフェースを使用するように修正
"use client"

import type { Entry, OpenEntry, ClosedEntry } from "@/types/entry"
import type { PositionActionProps } from "@/types/common-interfaces"
import { ArrowUpRight, ArrowDownRight, X, Clock, CheckCircle, TrendingUp, TrendingDown } from "lucide-react"
import { formatDate } from "@/utils/date"
import { calculateProfit, calculateProfitPercentage } from "@/utils/position"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { theme } from "@/styles/colors"

// 共通インターフェースを組み合わせて使用
interface PositionHistoryProps extends PositionActionProps {
  entries: Entry[]
}

export default function PositionHistory({ entries, onClosePosition, onCancelPosition }: PositionHistoryProps) {
  const [selectedTab, setSelectedTab] = useState<"open" | "closed">("open")

  // Simulate current price (in a real app, would use market price)
  // IMPORTANT: Avoid Math.random() during SSR to prevent hydration mismatch.
  const getCurrentPrice = (entryPrice: number) => {
    if (typeof window === "undefined") {
      // On the server, return the entry price so markup is deterministic
      return entryPrice
    }

    // Client-side only: random change ±5%
    const randomChange = (Math.random() - 0.5) * 0.1
    return entryPrice * (1 + randomChange)
  }

  // Close position handler
  const handleClosePosition = (entry: Entry) => {
    const currentPrice = getCurrentPrice(entry.price)
    onClosePosition(entry.id, currentPrice)
  }

  // Filter entries based on selected tab
  const filteredEntries = entries.filter((entry) =>
    selectedTab === "open" ? entry.status === "open" : entry.status === "closed"
  )

  return (
    <Card className="h-full flex flex-col border-0 rounded-none shadow-none" style={{ backgroundColor: theme.background.card }}>
      <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b" style={{ borderColor: theme.border.light }}>
        <CardTitle className="text-base font-medium" style={{ color: theme.text.primary }}>Position History</CardTitle>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "open" | "closed")}>
          <TabsList className="grid grid-cols-2 h-7 border" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light }}>
            <TabsTrigger 
              value="open" 
              className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white"
            >
              Open
            </TabsTrigger>
            <TabsTrigger 
              value="closed" 
              className="text-xs h-6 data-[state=active]:bg-[#2a2e3d] data-[state=active]:text-white"
            >
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-auto p-0" style={{ backgroundColor: theme.background.card }}>
        {filteredEntries.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm" style={{ color: theme.text.muted }}>
              {selectedTab === "open" ? "No open positions." : "No closed positions."}
            </p>
          </div>
        ) : (
          <PositionList
            entries={filteredEntries}
            handleClosePosition={handleClosePosition}
            onCancelPosition={onCancelPosition}
            getCurrentPrice={getCurrentPrice}
          />
        )}
      </CardContent>

      {selectedTab === "closed" && filteredEntries.length > 0 && (
        <>
          <Separator />
          <CardFooter className="p-3">
            <PositionSummary entries={filteredEntries} />
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Empty state component
function EmptyState({ selectedTab }: { selectedTab: "open" | "closed" }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm" style={{ color: theme.text.muted }}>
        {selectedTab === "open" ? "No open positions." : "No closed positions."}
      </p>
    </div>
  )
}

// 型ガード関数
// 共通で使用できるようにコンポーネント外に定義
const isClosedEntry = (entry: Entry): entry is ClosedEntry => {
  return entry.status === "closed";
};

// Position list component
function PositionList({
  entries,
  handleClosePosition,
  onCancelPosition,
  getCurrentPrice,
}: {
  entries: Entry[]
  handleClosePosition: (entry: Entry) => void
  onCancelPosition: (entryId: string) => void
  getCurrentPrice: (price: number) => number
}) {
  return (
    <div className="space-y-3 p-3" style={{ backgroundColor: theme.background.card }}>
      {entries.map((entry) => {
        const profit = calculateProfit(entry, getCurrentPrice)
        const profitPercentage = calculateProfitPercentage(entry, profit)
        const isProfitable = profit > 0

        return (
          <Card key={`${entry.id}-${entry.time}`} className="overflow-hidden" style={{ backgroundColor: theme.background.tertiary, borderColor: theme.border.light }}>
            <div className="p-3">
              <div className="flex items-center space-x-1">
                <Badge 
                  variant={entry.side === "buy" ? "success" : "destructive"} 
                  className="px-2 py-1 bg-opacity-20 border border-opacity-50"
                >
                  {entry.side === "buy" ? (
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                  )}
                  {entry.side === "buy" ? "LONG" : "SHORT"}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium" style={{ color: theme.text.primary }}>
                    ${entry.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {isClosedEntry(entry) && (
                    <div>
                      <div className="font-medium" style={{ color: theme.text.secondary }}>Exit Price:</div>
                      <div className="text-sm" style={{ color: theme.text.primary }}>
                        ${entry.exitPrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-bold flex items-center justify-end"
                  style={{ color: isProfitable ? theme.accent.green : theme.accent.red }}
                >
                  {isProfitable ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {profit > 0 ? "+" : ""}${Math.abs(profit).toFixed(2)} ({profitPercentage.toFixed(2)}%)
                </div>
                {entry.status === "open" && (
                  <div className="border-t p-3 flex justify-end space-x-2" style={{ borderColor: theme.border.light }}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      style={{ 
                        backgroundColor: theme.background.tertiary, 
                        borderColor: theme.border.light,
                        color: theme.text.secondary
                      }}
                      onClick={() => onCancelPosition(entry.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      className="text-xs"
                      style={{ 
                        backgroundColor: theme.accent.blue,
                        color: "white" 
                      }}
                      onClick={() => handleClosePosition(entry)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Close
                    </Button>
                  </div>
                )}
                {entry.status === "open" && (
                  <div className="flex items-center space-x-1">
                    <Badge variant="outline" className="text-xs" style={{ 
                      backgroundColor: theme.background.tertiary, 
                      borderColor: theme.border.highlight, 
                      color: theme.text.secondary 
                    }}>
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(entry.time)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Position summary component
function PositionSummary({ entries }: { entries: Entry[] }) {
  const totalProfit = calculateTotalProfit(entries)

  return (
    <div className="w-full">
      <div className="border-t p-3 flex justify-between items-center" style={{ borderColor: theme.border.light }}>
        <div>
          <div className="text-sm" style={{ color: theme.text.secondary }}>Profit/Loss:</div>
          <div className="font-bold" style={{ color: totalProfit >= 0 ? theme.accent.green : theme.accent.red }}>
            {totalProfit > 0 ? "+" : ""}${Math.abs(totalProfit).toFixed(2)}
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs" style={{ color: theme.text.secondary }}>Win Rate:</span>
          <span className="text-xs font-medium" style={{ color: theme.text.primary }}>{calculateWinRate(entries)}%</span>
        </div>
      </div>
    </div>
  )
}

// Calculate total profit
function calculateTotalProfit(entries: Entry[]): number {
  return entries.reduce((total, entry) => {
    // profitプロパティはclosedステータスのエントリーにのみ存在する
    if (entry.status === "closed" && 'profit' in entry) {
      return total + entry.profit
    }
    return total
  }, 0)
}

// Calculate win rate
function calculateWinRate(entries: Entry[]): number {
  if (entries.length === 0) return 0

  // 利益がプラスのトレードをカウント
  const winningTrades = entries.filter((entry) => {
    return entry.status === "closed" && 'profit' in entry && entry.profit > 0
  }).length
  
  // 完了したトレードのみを対象とする
  const closedTrades = entries.filter(entry => entry.status === "closed").length
  
  // 完了したトレードがない場合は0を返す
  if (closedTrades === 0) return 0
  
  return Math.round((winningTrades / closedTrades) * 100)
}
